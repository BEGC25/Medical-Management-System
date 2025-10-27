// Medical-Management-System/server/auth.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { pool } from "./db"; // <- use Postgres pool when available
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
    failedLoginCount?: number;
  }
}

const scryptAsync = promisify(scrypt);

// Fallback (SQLite/dev) hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Minimal, dependency-free CORS with allowlist + credentials
function corsAllowlistMiddleware(allowedOrigins: string[]) {
  const normalized = allowedOrigins
    .map((o) => o.trim())
    .filter(Boolean);

  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin as string | undefined;
    let ok = false;

    if (origin) {
      ok =
        normalized.includes(origin) ||
        // allow any *.vercel.app (preview deployments)
        origin.endsWith(".vercel.app");
    }

    if (ok && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-CSRF-Token"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  };
}

// OPTIONAL CSRF (disabled by default until frontend sends the header)
function csrfMiddleware(enforce: boolean) {
  const shouldEnforce = !!enforce;
  const exemptPaths = new Set<string>([
    "/api/login",
    "/api/logout",
    "/api/register",
    "/api/health",
  ]);

  return (req: any, res: any, next: any) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = randomBytes(24).toString("hex");
    }

    if (!shouldEnforce) return next();

    const method = req.method.toUpperCase();
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const path = req.path;

    if (!isStateChanging || exemptPaths.has(path)) return next();

    const header = (req.headers["x-csrf-token"] || "") as string;
    if (header && header === req.session.csrfToken) return next();

    return res.status(403).json({ error: "CSRF token invalid or missing" });
  };
}

export function setupAuth(app: Express) {
  const sessionSecret =
    process.env.SESSION_SECRET || "dev-secret-change-in-production";

  // Trust Render/Cloudflare proxy for secure cookies
  app.set("trust proxy", 1);

  // CORS before session
  const defaultAllowed = [
    "https://app.bahrelghazalclinic.com",
    "https://medical-management-system-wine.vercel.app",
    "http://localhost:5173",
    "http://localhost:5000",
  ];
  const envAllowed =
    process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || [];
  app.use(corsAllowlistMiddleware([...defaultAllowed, ...envAllowed]));

  const sessionSettings: session.SessionOptions = {
    name: "sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Render: true
      httpOnly: true,
      sameSite: "lax", // app.* and api.* are same-site
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // ---- LocalStrategy: prefer Postgres bcrypt(crypt) if pool exists; otherwise fallback to scrypt (SQLite/dev)
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        if (pool) {
          // Postgres path — password_hash column created with pgcrypto's crypt()
          const { rows } = await pool.query(
            `SELECT id, username, role
               FROM users
              WHERE username = $1
                AND is_active = TRUE
                AND crypt($2, password_hash) = password_hash
              LIMIT 1`,
            [username, password]
          );

          const user = rows[0];
          if (!user) return done(null, false);
          return done(null, user);
        } else {
          // SQLite/dev path — stored "password" using scrypt (legacy)
          const user = await storage.getUserByUsername(username);
          if (!user || !user.password) return done(null, false);
          const ok = await comparePasswords(password, user.password);
          if (!ok) return done(null, false);
          return done(null, user);
        }
      } catch (e) {
        return done(e as Error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (e) {
      done(e as Error);
    }
  });

  // Expose CSRF token (frontend can fetch and store it; send back via X-CSRF-Token if you enable enforcement)
  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // --- Registration (admin only). Uses DB-appropriate hashing automatically.
  app.post("/api/register", async (req: any, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { username, password, role = "clinician" } = req.body ?? {};
      if (!username || !password) {
        return res.status(400).json({ error: "username and password required" });
      }

      if (pool) {
        // Postgres path: write bcrypt via pgcrypto/crypt()
        const q = `
          INSERT INTO users (username, role, password_hash, is_active, status)
          VALUES ($1, $2, crypt($3, gen_salt('bf', 12)), TRUE, 'active')
          ON CONFLICT (username) DO UPDATE
          SET role = EXCLUDED.role,
              password_hash = EXCLUDED.password_hash,
              is_active = TRUE,
              status = 'active'
          RETURNING id, username, role
        `;
        const { rows } = await pool.query(q, [username, role, password]);
        return res.status(201).json(rows[0]);
      } else {
        // SQLite/dev: legacy scrypt storage helper
        const existing = await storage.getUserByUsername(username);
        if (existing) return res.status(400).json({ error: "Username already exists" });

        const user = await storage.createUser({
          ...req.body,
          password: await hashPassword(password),
        });
        const { password: _pw, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  // --- Login / Logout / Current user
  app.post("/api/login", (req: any, res, next) => {
    req.session.regenerate((err: any) => {
      if (err) return next(err);
      passport.authenticate("local", (authErr, user) => {
        if (authErr || !user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        req.login(user, (loginErr: any) => {
          if (loginErr) return next(loginErr);
          req.session.csrfToken = randomBytes(24).toString("hex");
          return res.status(200).json(user);
        });
      })(req, res, next);
    });
  });

  app.post("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy(() => res.sendStatus(200));
    });
  });

  app.get("/api/user", (req: any, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}
