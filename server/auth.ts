// Medical-Management-System/server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// 👇 add: drizzle db + sql tag
import { db, sql } from "./db";

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

// Minimal, dependency-free CORS with allowlist + credentials
function corsAllowlistMiddleware(allowedOrigins: string[]) {
  const normalized = allowedOrigins.map((o) => o.trim()).filter(Boolean);
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin as string | undefined;
    let ok = false;

    if (origin) {
      ok = normalized.includes(origin) || origin.endsWith(".vercel.app");
    }

    if (ok && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }

    if (req.method === "OPTIONS") return res.sendStatus(204);
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
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // ---- Local strategy: let Postgres verify the password with crypt() ----
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // one query: verify hash + ensure active
        const result: any = await db.execute(sql`
          SELECT id, username, role
          FROM users
          WHERE username = ${username}
            AND crypt(${password}, password_hash) = password_hash
            AND COALESCE(is_active, true) = true
            AND COALESCE(status, 'active') = 'active'
          LIMIT 1
        `);

        const rows = Array.isArray(result) ? result : result.rows;
        const user = rows?.[0];
        if (!user) return done(null, false);

        return done(null, user);
      } catch (e) {
        return done(e);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (e) {
      done(e);
    }
  });

  // Expose CSRF token
  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // ---- Register: store pgcrypto hash in password_hash ----
  app.post("/api/register", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { username, password, role = "staff", is_active = true, status = "active" } =
        req.body || {};

      if (!username || !password) {
        return res.status(400).json({ error: "username and password required" });
      }

      const result: any = await db.execute(sql`
        INSERT INTO users (username, role, password_hash, is_active, status)
        VALUES (${username}, ${role}, crypt(${password}, gen_salt('bf', 12)), ${is_active}, ${status})
        ON CONFLICT (username) DO UPDATE
          SET role = EXCLUDED.role,
              password_hash = EXCLUDED.password_hash,
              is_active = EXCLUDED.is_active,
              status = EXCLUDED.status
        RETURNING id, username, role, is_active, status
      `);

      const rows = Array.isArray(result) ? result : result.rows;
      return res.status(201).json(rows[0]);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  // ---- Login: unchanged surface, works with pgcrypto hashes ----
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
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user!);
  });
}
