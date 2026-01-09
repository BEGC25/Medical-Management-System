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
  // postgresql://user:***@host/db?...   (hide password only)
  return url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@");
}

// --- Boot-time diagnostics (printed once in platform logs)
console.log("[BOOT] NODE_ENV =", process.env.NODE_ENV);
console.log("[BOOT] DATABASE_URL =", maskDbUrl(process.env.DATABASE_URL));
console.log("[BOOT] DIRECT_DATABASE_URL =", maskDbUrl(process.env.DIRECT_DATABASE_URL));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// We're behind a proxy (Northflank / Render / Cloudflare, etc.)
app.set("trust proxy", 1);

/**
 * Build an allowlist:
 * - ALLOWED_ORIGINS: comma-separated fully-qualified origins
 * - NF_HOSTS: Northflank-injected hostnames (no scheme); we convert to https://<host>
 */
function buildAllowedOrigins(): string[] {
  const fromEnv =
    process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ??
    [];

  const fromNorthflankHosts =
    process.env.NF_HOSTS?.split(",")
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h) => `https://${h}`) ?? [];

  // Always allow local dev defaults (harmless in production because origin must match exactly)
  const defaults = ["http://localhost:5173", "http://localhost:5000"];

  // De-dupe
  return Array.from(new Set([...defaults, ...fromEnv, ...fromNorthflankHosts]));
}

const allowedOrigins = buildAllowedOrigins();

function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true; // curl/postman/mobile apps often send no Origin
  if (allowedOrigins.includes(origin)) return true;

  // Allow Vercel preview deployments
  if (origin.endsWith(".vercel.app")) return true;

  return false;
}

/**
 * CORS:
 * - Only for /api (so your JS/CSS/static don’t get blocked)
 * - Never throw errors (prevents 500s)
 */
const apiCors = cors({
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
});

app.use("/api", apiCors);
app.options("/api/*", apiCors);

// ✅ Setup session middleware BEFORE routes
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";

const sessionSettings: session.SessionOptions = {
  name: "sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  // Use persistent store if your storage provides it
  // (prevents MemoryStore warning and keeps sessions stable)
  store: (storage as any).sessionStore || undefined,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

app.use(session(sessionSettings));
console.log("✅ Session middleware configured");

// Public uptime endpoint (for Northflank health checks)
app.get("/health", (_req, res) => res.status(200).send("ok"));

// Public diagnostics endpoint (DB-aware, if implemented)
app.get("/api/health", async (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (typeof (storage as any).healthCheck !== "function") {
      // Keep endpoint alive even if you didn’t implement healthCheck yet
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

// Simple API request logger (captures JSON responses)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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
      if (line.length > 160) line = line.slice(0, 159) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Centralized error handler (do NOT crash the server)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[ERROR]", err);
    res.status(status).json({ message });
  });

  // Mount Vite (dev) or serve built assets (prod)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use platform-injected PORT; fallback for local dev
  const port = Number(process.env.PORT) || 8080;
  const host = "0.0.0.0";

  server.listen(
    {
      port,
      host,
      reusePort: process.platform !== "win32",
    },
    () => {
      log(`serving on port ${port}`);
      console.log("[BOOT] Allowed origins:", allowedOrigins);
    }
  );
})();
