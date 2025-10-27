// Medical-Management-System/server/auth.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User as SelectUser } from "@shared/schema";
import { pool } from "./db"; // <-- use Postgres pool for bcrypt verify

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

/* ----------------- hashing helpers ----------------- */

// scrypt (our local format: "<hex>.<saltHex>")
async function scryptHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function scryptCompare(supplied: string, stored: string) {
  const parts = stored.split(".");
  if (parts.length !== 2) return false;
  const [hex, salt] = parts;
  const hashedBuf = Buffer.from(hex, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// bcrypt (pgcrypto) — let Postgres verify it for us
async function bcryptCompareViaPgcrypto(
  supplied: string,
  bcryptHashFromDb: string
) {
  // When running on SQLite locally, pool will be null; bcrypt hashes won’t exist there.
  if (!pool) return false;
  const { rows } = await pool.query<{ ok: boolean }>(
    "SELECT crypt($1, $2) = $2 AS ok",
    [supplied, bcryptHashFromDb]
  );
  return !!rows?.[0]?.ok;
}

/**
 * Accept both password field names and both hashing schemes.
 * - bcrypt in column `password_hash` (starts with "$2") => verify in Postgres
 * - scrypt in column `password` (format "<hex>.<salt>") => verify in Node
 */
async function flexibleVerifyPassword(
  supplied: string,
  user: any
): Promise<boolean> {
  const stored =
    (user?.password as string | undefined) ??
    (user?.password_hash as string | undefined) ??
    "";

  if (!stored) return false;

  // bcrypt hashes look like "$2a$..." or "$2b$..."
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcryptCompareViaPgcrypto(supplied, stored);
  }

  // our scrypt format contains a dot between hex and salt
  if (stored.includes(".")) {
    return scryptCompare(supplied, stored);
  }

  // unknown format
  return false;
}

/* ----------------- minimal, dependency-free CORS ----------------- */

function corsAllowlistMiddleware(allowedOrigins: string[]) {
  const normalized = allowedOrigins.map((o) => o.trim()).filter(Boolean);
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin as string | undefined;
    let ok = false;

    if (origin) {
      ok =
        normalized.includes(origin) ||
        origin.endsWith(".vercel.app"); // allow Vercel previews
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

    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  };
}

/* ----------------- optional CSRF ----------------- */

function csrfMiddleware(enforce: boolean) {
  const shouldEnforce = !!enforce;
  const exempt = new Set<string>([
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
    const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (!stateChanging || exempt.has(req.path)) return next();

    const header = (req.headers["x-csrf-token"] || "") as string;
    if (header && header === req.session.csrfToken) return next();

    return res.status(403).json({ error: "CSRF token invalid or missing" });
  };
}

/* ----------------- main setup ----------------- */

export function setupAuth(app: Express) {
  const sessionSecret =
    process.env.SESSION_SECRET || "dev-secret-change-in-production";

  // Render/Vercel proxies
  app.set("trust proxy", 1);

  // CORS first
  const defaultAllowed = [
    "https://app.bahrelghazalclinic.com",
    "https://medical-management-system-wine.vercel.app",
    "http://localhost:5173",
    "http://localhost:5000",
  ];
  const envAllowed =
    process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || [];
  app.use(corsAllowlistMiddleware([...defaultAllowed, ...envAllowed]));

  // Sessions
  const sessionSettings: session.SessionOptions = {
    name: "sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true on Render
      httpOnly: true,
      sameSite: "lax", // api.* and app.* are same-site
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy — **supports bcrypt (pgcrypto) & scrypt**
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false);
        const ok = await flexibleVerifyPassword(password, user);
        if (!ok) return done(null, false);
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

  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // Routes
  app.post("/api/register", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const exists = await storage.getUserByUsername(req.body.username);
      if (exists) return res.status(400).send("Username already exists");

      // We’ll store scrypt in `password` by default for new users.
      const user = await storage.createUser({
        ...req.body,
        password: await scryptHash(req.body.password),
      });

      const { password, ...safe } = user;
      res.status(201).json(safe);
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
          const { password, password_hash, ...safe } = user as any;
          return res.status(200).json(safe);
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
      return res.sendStatus(401); // expected on the blank login screen
    }
    const { password, password_hash, ...safe } = req.user as any;
    res.json(safe);
  });
}
