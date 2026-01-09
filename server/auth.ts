// Medical-Management-System/server/auth.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
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
  // IMPORTANT:
  // - CORS is configured in server/index.ts
  // - Session middleware is configured in server/index.ts

  app.use(passport.initialize());
  app.use(passport.session());

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
    }),
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

  app.post("/api/register", async (req: any, res) => {
    try {
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
    req.session.regenerate((err: any) => {
      if (err) return next(err);

      passport.authenticate("local", (authErr: any, user: any) => {
        if (authErr || !user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        req.login(user, (loginErr: any) => {
          if (loginErr) return next(loginErr);

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
