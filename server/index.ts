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

// --- Boot-time diagnostics
console.log("[BOOT] NODE_ENV =", process.env.NODE_ENV);
console.log("[BOOT] DATABASE_URL =", maskDbUrl(process.env.DATABASE_URL));
console.log("[BOOT] DIRECT_DATABASE_URL =", maskDbUrl(process.env.DIRECT_DATABASE_URL));

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Allowed origins:
 * - In dev: allow all
 * - In prod: allowlist + optional *.vercel.app previews
 */
const defaultAllowed = [
  "https://app.bahrelghazalclinic.com",
  "https://medical-management-system-wine.vercel.app",
  "http://localhost:5173",
];

const envAllowed =
  process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) || [];

const allowedOrigins = Array.from(new Set([...defaultAllowed, ...envAllowed]));

const corsOptions: cors.CorsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl/postman/health checks

    if (isDevelopment) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // optional: allow any Vercel preview domain
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    // IMPORTANT: do NOT throw an error here (it becomes 500s). Just deny.
    return callback(null, false);
  },
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Behind proxy (Northflank/Render/Cloudflare)
app.set("trust proxy", 1);

// ✅ Session middleware (single source of truth)
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";

const sessionSettings: session.SessionOptions = {
  name: "sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore, // ✅ IMPORTANT (no MemoryStore)
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionSettings));
console.log("✅ Session middleware configured");

// Simple API request logger
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
        } catch {}
      }
      if (line.length > 140) line = line.slice(0, 139) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Health checks
  app.get("/health", (_req, res) => res.status(200).send("ok"));

  app.get("/api/health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      if (typeof (storage as any).healthCheck !== "function") {
        return res.json({ ok: true, note: "storage.healthCheck() not implemented" });
      }
      const row = await (storage as any).healthCheck();
      return res.json({ ok: true, ...row });
    } catch (e: any) {
      console.error("[/api/health] error:", e);
      return res.status(500).json({ ok: false, error: e?.message || "DB error" });
    }
  });

  // Error handler (do NOT throw again)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[ERROR]", err);
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 8080;
  const host = "0.0.0.0";

  server.listen({ port, host, reusePort: process.platform !== "win32" }, () => {
    log(`serving on port ${port}`);
  });
})();
