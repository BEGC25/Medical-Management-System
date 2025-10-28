// Medical-Management-System/server/auth.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { pool } from "./db";  // Postgres pool for DB queries
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

// (Kept for completeness; registration uses pgcrypto in Postgres)
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
        "X-Requested-With, Content-Type, X-CSRF-Token"
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      if (req.method === "OPTIONS") {
        // preflight
        res.status(200).end();
        return;
      }
    }
    next();
  };
}

// Simple CSRF (double submit cookie)
function csrfMiddleware(enforce: boolean) {
  return (req: any, res: any, next: any) => {
    if (!req.session) return next(new Error("Session not initialized"));
    if (!req.session.csrfToken) {
      req.session.csrfToken = randomBytes(16).toString("hex");
    }
    const token = req.get("X-CSRF-Token");
    const method = req.method?.toUpperCase?.();
    const isWrite =
      method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH";
    if (enforce && isWrite) {
      if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({ error: "Invalid CSRF token" });
      }
    }
    next();
  };
}

export function setupAuth(app: Express) {
  // CORS allowlist from env (comma-separated)
  const allowedOrigins = (process.env.CORS_ALLOWLIST || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(corsAllowlistMiddleware(allowedOrigins));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy: verify using Postgres (bcrypt via pgcrypto's crypt())
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const result = await pool.query(
          "SELECT * FROM users WHERE username = $1 AND crypt($2, password_hash) = password_hash",
          [username, password]
        );
        const user = result.rows[0];
        if (!user) return done(null, false);
        return done(null, user);
      } catch (e) {
        console.error("Auth error:", e);
        return done(e);
      }
    })
  );

  // Use username as the session identifier (works if there's no numeric id)
  passport.serializeUser((user, done) => done(null, (user as any).username));
  passport.deserializeUser(async (username: string, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      done(null, user || false);
    } catch (e) {
      done(e);
    }
  });

  // CSRF
  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // === Auth routes ===

  // Admin-only registration; store bcrypt hash via pgcrypto in Postgres
  app.post("/api/register", async (req: any, res) => {
    try {
      if (!req.isAuthenticated?.() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const result = await pool.query(
        "INSERT INTO users (username, password_hash, full_name, role, is_active, status, created_at) VALUES ($1, crypt($2, gen_salt('bf', 12)), $3, $4, true, 'active', NOW()::text) RETURNING *",
        [
          req.body.username,
          req.body.password,
          req.body.fullName || null,
          req.body.role || "reception",
        ]
      );
      const { password_hash, password, ...userWithoutPassword } = result.rows[0];
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Login → return JSON so clients can call response.json()
  app.post("/api/login", (req: any, res, next) => {
    req.session.regenerate((err: any) => {
      if (err) return next(err);
      passport.authenticate("local", (authErr, user) => {
        if (authErr) return next(authErr);
        if (!user) {
          req.session.failedLoginCount = (req.session.failedLoginCount || 0) + 1;
          const delayMs = Math.min(3000, 200 * req.session.failedLoginCount);
          return setTimeout(() => res.sendStatus(401), delayMs);
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          req.session.failedLoginCount = 0;
          req.session.csrfToken = randomBytes(16).toString("hex");
          return res.status(200).json({ ok: true });
        });
      })(req, res, next);
    });
  });

  app.post("/api/logout", (req: any, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.sendStatus(200);
      });
    });
  });

  // Current user (strip secrets, coerce BigInt → number to avoid JSON crash)
  app.get("/api/user", (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.sendStatus(401);
    }
    const raw = req.user as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === "password" || k === "password_hash") continue;
      cleaned[k] = typeof v === "bigint" ? Number(v) : v;
    }
    return res.json(cleaned);
  });

  // Optional: super-light text endpoint to verify session without JSON serialization issues
  app.get("/api/whoami", (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user) return res.sendStatus(401);
    return res.type("text").send(String((req.user as any)?.username ?? "unknown"));
  });
}
