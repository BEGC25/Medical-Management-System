// Medical-Management-System/server/auth.ts
import type { Express } from "express";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { randomBytes } from "node:crypto";
import { storage } from "./storage";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User {
      username: string;
      role: string;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

/* ---------------- helpers: CORS + CSRF ---------------- */

function corsAllowlistMiddleware(allowed: string[]) {
  const normalized = allowed.map(s => s.trim()).filter(Boolean);
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin;
    const ok =
      !!origin &&
      (normalized.includes(origin) || origin.endsWith(".vercel.app"));
    if (ok && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  };
}

function csrfMiddleware(enforce: boolean) {
  const exempt = new Set(["/api/login", "/api/logout", "/api/register", "/api/health"]);
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.csrfToken) req.session.csrfToken = randomBytes(24).toString("hex");
    if (!enforce) return next();
    const method = req.method.toUpperCase();
    const write = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
    if (!write || exempt.has(req.path)) return next();
    const header = (req.headers["x-csrf-token"] || "") as string;
    if (header && header === req.session.csrfToken) return next();
    return res.status(403).json({ error: "CSRF token invalid or missing" });
  };
}

/* ---------------- DISABLED AUTH MODE ---------------- */

function setupAuthDisabled(app: Express) {
  // Trust proxy so secure cookies work on Render/CF
  app.set("trust proxy", 1);

  // CORS
  const defaultAllowed = [
    "https://app.bahrelghazalclinic.com",
    "https://medical-management-system-wine.vercel.app",
    "http://localhost:5173",
    "http://localhost:5000",
  ];
  const envAllowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  app.use(corsAllowlistMiddleware([...defaultAllowed, ...envAllowed]));

  // Session
  const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-me";
  app.use(session({
    name: "sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));

  // Always treat the request as authenticated admin
  const demoUser: Express.User = { username: "demo", role: "admin" };
  app.use((req, _res, next) => {
    (req as any).isAuthenticated = () => true;
    (req as any).user = demoUser;
    if (!req.session.csrfToken) req.session.csrfToken = randomBytes(24).toString("hex");
    next();
  });

  // CSRF helper
  app.use(csrfMiddleware(false));
  app.get("/api/csrf", (req, res) => res.json({ csrfToken: req.session.csrfToken }));

  // Auth endpoints: succeed without checks
  app.post("/api/login", (req, res) => {
    req.session.regenerate(() => {
      req.session.csrfToken = randomBytes(24).toString("hex");
      res.status(200).json(demoUser);
    });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => res.sendStatus(200));
  });

  app.get("/api/user", (_req, res) => res.json(demoUser));
}

/* ---------------- REAL AUTH MODE (kept for later) --------------- */

async function verifyWithPgcrypto(username: string, password: string) {
  const q = `
    SELECT username, role, is_active, status,
           (crypt($1, password_hash) = password_hash) AS ok
    FROM users
    WHERE username = $2
    LIMIT 1;
  `;
  const r = await pool!.query(q, [password, username]);
  const row = r.rows[0];
  if (!row || !row.ok) return null;
  if (row.is_active === false || String(row.status || "").toLowerCase() === "disabled") return null;
  return { username: row.username, role: row.role } as Express.User;
}

function setupAuthReal(app: Express) {
  app.set("trust proxy", 1);

  const defaultAllowed = [
    "https://app.bahrelghazalclinic.com",
    "https://medical-management-system-wine.vercel.app",
    "http://localhost:5173",
    "http://localhost:5000",
  ];
  const envAllowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  app.use(corsAllowlistMiddleware([...defaultAllowed, ...envAllowed]));

  const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-me";
  app.use(session({
    name: "sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      if (pool) {
        const user = await verifyWithPgcrypto(username, password);
        return done(null, user || false);
      }
      // Fallback (SQLite dev only)
      const u = await storage.getUserByUsername(username);
      if (u && (u as any).password === password) return done(null, { username: u.username, role: u.role });
      return done(null, false);
    } catch (e) { return done(e); }
  }));

  passport.serializeUser((user, done) => done(null, (user as any).username));
  passport.deserializeUser(async (username: string, done) => {
    try {
      if (pool) {
        const r = await pool.query("SELECT username, role FROM users WHERE username=$1 LIMIT 1;", [username]);
        const row = r.rows[0];
        return done(null, row ? ({ username: row.username, role: row.role } as Express.User) : false);
      } else {
        const u = await storage.getUserByUsername(username);
        return done(null, u ? ({ username: u.username, role: u.role } as Express.User) : false);
      }
    } catch (e) { done(e); }
  });

  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req, res) => res.json({ csrfToken: req.session.csrfToken }));

  app.post("/api/login", (req, res, next) => {
    req.session.regenerate(err => {
      if (err) return next(err);
      passport.authenticate("local", (authErr, user) => {
        if (authErr || !user) return res.status(401).json({ error: "Invalid credentials" });
        req.login(user, loginErr => {
          if (loginErr) return next(loginErr);
          req.session.csrfToken = randomBytes(24).toString("hex");
          res.status(200).json(user);
        });
      })(req, res, next);
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.session.destroy(() => res.sendStatus(200));
    });
  });

  app.get("/api/user", (req, res) => {
    if (typeof (req as any).isAuthenticated !== "function" || !(req as any).isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}

/* ---------------- exported entry ---------------- */

export function setupAuth(app: Express) {
  const disabled = (process.env.DISABLE_AUTH || "").toLowerCase() === "1"
    || (process.env.DISABLE_AUTH || "").toLowerCase() === "true";

  if (disabled) {
    console.log("[auth] DISABLE_AUTH=1 — authentication is disabled, every request is admin.");
    setupAuthDisabled(app);
  } else {
    setupAuthReal(app);
  }
}
