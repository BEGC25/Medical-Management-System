// Medical-Management-System/server/auth.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";                 // your drizzle instance
import { sql } from "drizzle-orm";         // IMPORTANT: import sql from drizzle-orm
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

// --- helpers ---------------------------------------------------------------

async function hashPasswordScrypt(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswordScrypt(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) return false;
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Try verifying with Postgres pgcrypto (bcrypt).
 * Returns the user row when ok, otherwise null.
 */
async function verifyWithPgCrypto(username: string, password: string) {
  // Only attempt if we are clearly on Postgres
  const isPg =
    (process.env.DATABASE_URL || "").startsWith("postgres://") ||
    (process.env.DATABASE_URL || "").startsWith("postgresql://");

  if (!isPg) return null;

  // Requires: CREATE EXTENSION IF NOT EXISTS pgcrypto;
  // The crypt() check will only succeed when password_hash is a bcrypt hash ($2a$…)
  // and 'password' matches.
  const result: any = await db.execute(sql`
    SELECT id, username, role, password_hash, is_active, status
    FROM users
    WHERE username = ${username}
      AND crypt(${password}, password_hash) = password_hash
    LIMIT 1
  `);

  // drizzle-node-postgres returns { rows } or array depending on version; normalize:
  const rows = (result?.rows ?? result) as any[];
  if (Array.isArray(rows) && rows.length > 0) {
    const u = rows[0];
    // Optional account status checks
    if (u.is_active === false) return null;
    if (u.status && String(u.status).toLowerCase() !== "active") return null;

    // Normalize to your app's User shape
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      password: u.password_hash, // keep for compatibility with serialize/compare fallbacks
      password_hash: u.password_hash,
      is_active: u.is_active,
      status: u.status,
    } as SelectUser;
  }
  return null;
}

/**
 * Fallback verifier for non-Postgres (e.g., SQLite dev) using scrypt format: "<hex>.<salt>"
 */
async function verifyWithScrypt(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) return null;

  // Support both fields: some older code used "password", newer uses "password_hash"
  const stored = (user as any).password ?? (user as any).password_hash ?? "";
  const ok = await comparePasswordScrypt(password, stored);
  if (!ok) return null;

  return user;
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

// --- main ------------------------------------------------------------------

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
      sameSite: "lax", // app.* and api.* are same-site
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy with Postgres(bcrypt) -> scrypt fallback
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // 1) Try verifying against Postgres bcrypt (pgcrypto)
        const pgUser = await verifyWithPgCrypto(username, password);
        if (pgUser) return done(null, pgUser);

        // 2) Fallback to scrypt-stored strings (SQLite or older dev data)
        const scryptUser = await verifyWithScrypt(username, password);
        if (scryptUser) return done(null, scryptUser);

        // no match
        return done(null, false);
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

  // Expose CSRF token (frontend: call once after login, store and send via X-CSRF-Token)
  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // Auth routes
  app.post("/api/register", async (req: any, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // New users created from the app will use scrypt (safe & portable)
      const user = await storage.createUser({
        ...req.body,
        password: await hashPasswordScrypt(req.body.password),
      });

      const { password, ...userWithoutPassword } = user as any;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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
          const { password, password_hash, ...rest } = user as any;
          return res.status(200).json(rest);
        });
      })(req, res, next);
    });
  });

  app.post("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req: any, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const { password, password_hash, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}
