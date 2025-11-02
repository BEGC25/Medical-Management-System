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

// --- Boot-time diagnostics (prints once in Render logs)
console.log("[BOOT] NODE_ENV =", process.env.NODE_ENV);
console.log("[BOOT] DATABASE_URL =", maskDbUrl(process.env.DATABASE_URL));
console.log("[BOOT] DIRECT_DATABASE_URL =", maskDbUrl(process.env.DIRECT_DATABASE_URL));

/** CORS configuration - permissive in development, strict in production */
const isDevelopment = process.env.NODE_ENV === "development";

if (isDevelopment) {
  app.use(
    cors({
      origin: true, // allow all in dev
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
} else {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : [];

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow tools with no Origin (curl, Postman, mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Setup session middleware BEFORE routes
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";
app.set("trust proxy", 1); // Trust Render/Cloudflare proxy for secure cookies

const sessionSettings: session.SessionOptions = {
  name: "sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
};

app.use(session(sessionSettings));
console.log("✅ Session middleware configured");

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
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // ──────────────────────────────
  // Robust health checks
  // ──────────────────────────────

  // Simple uptime endpoint (for Render/ALB)
  app.get("/health", (_req, res) => res.status(200).send("ok"));

  // DB-aware health endpoint (used by you and the client)
  app.get("/api/health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      if (typeof (storage as any).healthCheck !== "function") {
        throw new Error(
          "storage.healthCheck() is not implemented. Add it to server/storage.ts as discussed."
        );
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
      // Return structured error so 500s are actionable
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

  // Centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // rethrow so it surfaces in Render logs
    throw err;
  });

  // Mount vite (dev) or serve built assets (prod)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use Render's injected PORT; fallback for local dev
  const port = Number(process.env.PORT) || 5000;
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
