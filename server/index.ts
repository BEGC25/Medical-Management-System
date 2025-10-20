// Medical-Management-System/server/index.ts

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust the reverse proxy (Render) so secure cookies & IPs work correctly
app.set("trust proxy", 1);

// --- Minimal security headers (no extra deps) ---
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// --- Lightweight CORS allowlist (defense-in-depth, no 'cors' package) ---
// Set CORS_ALLOWED_ORIGINS="https://app.bahrelghazalclinic.com,https://staging.app.bahrelghazalclinic.com,http://localhost:5173"
const ALLOWLIST = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  // Allow if origin is on the allowlist (or if no allowlist configured)
  if (origin && (ALLOWLIST.length === 0 || ALLOWLIST.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Safe API access logger (no response bodies / no PHI) ---
app.use((req, res, next) => {
  const start = Date.now();

  // simple request id for correlating logs
  const rid = (Math.random().toString(36).slice(2) + Date.now().toString(36)).toUpperCase();
  res.setHeader("X-Request-Id", rid);

  res.on("finish", () => {
    // Log only API traffic to keep noise down
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      log(`[api] ${req.method} ${req.path} ${res.statusCode} ${duration}ms rid=${rid}`);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // rethrow so it shows in Render logs
    throw err;
  });

  // Dev vs prod static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Stronger health checks
  // NOTE: Keep your existing "/" health for Render, and add API-scoped as well.
  app.get("/health", (_req, res) => res.status(200).send("ok"));
  app.get("/api/health", (_req, res) => res.status(200).send("ok"));

  // Bind to Render-provided PORT (e.g., 8080), fallback to 5000 locally
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
    }
  );
})();
Touches.
