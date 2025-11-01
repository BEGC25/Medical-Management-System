// Medical-Management-System/server/auth.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
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
    // ensure token exists on session
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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-site cookies in production
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false);
        const ok = await comparePasswords(password, user.password);
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

  // Expose CSRF token (frontend: call once after login, store and send via X-CSRF-Token)
  const enforceCsrf = process.env.ENFORCE_CSRF === "1";
  app.use(csrfMiddleware(enforceCsrf));
  app.get("/api/csrf", (req: any, res) => {
    res.json({ csrfToken: req.session.csrfToken });
  });

  // Auth routes
  app.post("/api/register", async (req: any, res, next) => {
    try {
      // Only admins can create users
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/login", (req: any, res, next) => {
    // Regenerate to prevent session fixation
    req.session.regenerate((err: any) => {
      if (err) return next(err);
      passport.authenticate("local", (authErr, user) => {
        if (authErr || !user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        req.login(user, (loginErr: any) => {
          if (loginErr) return next(loginErr);
          // Refresh CSRF token on new session
          req.session.csrfToken = randomBytes(24).toString("hex");
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
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
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}
