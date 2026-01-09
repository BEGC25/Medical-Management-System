// Medical-Management-System/server/index.ts

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

/** Mask DB URL for safe boot logging */
function maskDbUrl(url?: string) {
  if (!url) return "";
  return url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@");
}

// --- Boot-time diagnostics (printed once in platform logs)
console.log("[BOOT] NODE_ENV =", process.env.NODE_ENV);
console.log("[BOOT] DATABASE_URL =", maskDbUrl(process.env.DATABASE_URL));
console.log("[BOOT] DIRECT_DATABASE_URL =", maskDbUrl(process.env.DIRECT_DATABASE_URL));

/**
 * We are behind a proxy (Vercel -> backend, and/or platform LB).
 * This is REQUIRED for secure cookies (req.secure) to work correctly.
 */
app.set("trust proxy", 1);

// ──────────────────────────────
// CORS (ONE place only)
// ──────────────────────────────
const isDev = process.env.NODE_ENV === "development";

const rawAllowed = (process.env.ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Allow only *your* Vercel project domains (not every vercel.app on earth)
const isAllowedVercelProject = (origin: string) =>
  /^https:\/\/(medical-management-system).*\.vercel\.app$/.test(origin);

// Optional: allow your Northflank code.run site if you ever open the UI there
const isAllowedCodeRun = (origin: string) =>
  /^https:\/\/site--bgc-managementsystem--.*\.code\.run$/.test(origin);

function isOriginAllowed(origin?: string) {
  if (!origin) return true; // curl/postman/no Origin
  if (rawAllowed.includes(origin)) return true;
  if (isAllowedVercelProject(origin)) return true;
  if (isAllowedCodeRun(origin)) return true;
  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => cb(null, isDev ? true : isOriginAllowed(origin)),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ──────────────────────────────
// Session (ONE place only)
// ──────────────────────────────
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";

// Prefer your persistent store if you have one (storage.sessionStore)
const sessionStore = (storage as any).sessionStore as session.Store | undefined;

const sessionSettings: session.SessionOptions = {
  name: "sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  ...(sessionStore ? { store: sessionStore } : {}),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

app.use(session(sessionSettings));
console.log("✅ Session middleware configured");

// Simple API request logger (captures JSON responses)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = (bodyJson: any) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          // ignore stringify errors
        }
      }
      if (line.length > 120) line = line.slice(0, 119) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Simple uptime endpoint (for platform health checks)
  app.get("/health", (_req, res) => res.status(200).send("ok"));

  // DB-aware health endpoint (diagnostics)
  app.get("/api/health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      if (typeof (storage as any).healthCheck !== "function") {
        return res.json({ ok: true, note: "storage.healthCheck() not implemented" });
      }
      const row = await (storage as any).healthCheck();
      return res.json({
        ok: true,
        now: row.now,
        patients: Number(row.patients || 0),
        services: Number(row.services || 0),
        billing_settings: Number(row.billing_settings || 0),
      });
    } catch (e: any) {
      console.error("[/api/health] error:", e);
      return res.status(500).json({
        ok: false,
        error: e?.message || "DB error",
        code: e?.code,
        detail: e?.detail,
        hint: e?.hint,
        where: e?.where,
      });
    }
  });

  // Centralized error handler (DO NOT rethrow; it can crash the server)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ERROR]", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Mount Vite (dev) or serve built assets (prod)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 8080;
  const host = "0.0.0.0";

  server.listen(
    { port, host, reusePort: process.platform !== "win32" },
    () => log(`serving on port ${port}`),
  );
})();
