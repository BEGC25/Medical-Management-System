// Medical-Management-System/server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

import { storage } from "./storage";
import { sql } from "drizzle-orm"; // <-- needed for DB-side password check
import { db } from "./db";         // drizzle instance

declare global {
  namespace Express {
    // minimal shape stored in session
    interface User {
      id: number;
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
    next();
  };
}

// OPTIONAL CSRF (you can leave it off until the app sends the header)
function csrfMiddleware(enforce: boolean) {
  const exempt = new Set<string>(["/api/login", "/api/logout", "/api/health"]);
  return (req: any, res: any, next: any) => {
    if (!req.session.csrfToken) req.session.csrfToken = randomBytes(24).toString("hex");
    if (!enforce) return next();
    const needs = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase());
    if (!needs || exempt.has(req.path)) return next();
    const hdr = (req.headers["x-csrf-token"] || "") as string;
    if (hdr && hdr === req.session.csrfToken) return next();
    return res.status(403).json({ error: "CSRF token invalid or missing" });
  };
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "dev-secret";
  app.set("trust proxy", 1);

  const defaultAllowed = [
    "https://app.bahrelghazalclinic.com",
    "https://medical-management-system-wine.vercel.app",
    "http://localhost:5173",
    "http://localhost:5000",
  ];
  const envAllowed =
    process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || [];
  app.use(corsAllowlistMiddleware([...defaultAllowed, ...envAllowed]));

  app.use(
    session({
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
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ✅ Verify password inside Postgres using pgcrypto `crypt(...)`
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const result = await db.execute(sql`
          SELECT id, username, role
          FROM users
          WHERE username = ${username}
            AND is_active = TRUE
            AND crypt(${password}, password_hash) = password_hash
          LIMIT 1
        `);
        const user = (result as any).rows?.[0];
        if (!user) return done(null, false);
        return done(null, user);
      } catch (e) {
        return done(e as Error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id); // must return {id, username, role, ...}
      done(null, user ? { id: user.id, username: user.username, role: user.role } : false);
    } catch (e) {
      done(e);
    }
  });

  app.use(csrfMiddleware(process.env.ENFORCE_CSRF === "1"));
  app.get("/api/csrf", (req: any, res) => res.json({ csrfToken: req.session.csrfToken }));

  app.post("/api/login", (req: any, res, next) => {
    req.session.regenerate((err: any) => {
      if (err) return next(err);
      passport.authenticate("local", (authErr, user) => {
        if (authErr || !user) return res.status(401).json({ error: "Invalid credentials" });
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
    res.json(req.user);
  });
}
