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
console.log(
  "[BOOT] DIRECT_DATABASE_URL =",
  maskDbUrl(process.env.DIRECT_DATABASE_URL),
);

/** CORS configuration */
const isDevelopment = process.env.NODE_ENV === "development";

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = isDevelopment
  ? {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    }
  : {
      origin: (origin, callback) => {
        // Allow requests with no Origin (same-origin, static assets, curl/postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.endsWith(".vercel.app")) return callback(null, true);

        // IMPORTANT: do not throw (prevents 500)
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    };

// Apply CORS only to API routes
app.use("/api", cors(corsOptions));
app.options("/api/*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy (Northflank/Cloudflare/etc.)
app.set("trust proxy", 1);

// ✅ Session middleware BEFORE routes
const sessionSecret =
  process.env.SESSION_SECRET || "dev-secret-change-in-production";

const sessionSettings: session.SessionOptions = {
  name: "sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
};

app.use(session(sessionSettings));
console.log("✅ Session middleware configured");

// ✅ Register health endpoints EARLY (before any catch-all/static fallback)
app.get("/health", (_req, res) => res.status(200).send("ok"));

app.get("/api/health", async (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    // If your storage has a healthCheck() use it; otherwise just return ok:true
    if (typeof (storage as any).healthCheck === "function") {
      const row = await (storage as any).healthCheck();
      return res.json({
        ok: true,
        now: row.now,
        patients: Number(row.patients || 0),
        services: Number(row.services || 0),
        billing_settings: Number(row.billing_settings || 0),
      });
    }

    return res.json({ ok: true });
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
          // ignore
        }
      }
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Mount Vite (dev) or serve built assets (prod)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Centralized error handler LAST (do NOT throw)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[ERROR]", err);
    res.status(status).json({ message });
  });

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
    },
  );
})();
