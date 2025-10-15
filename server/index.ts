// Medical-Management-System/server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Small hardening
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API request logger (captures JSON bodies)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let captured: unknown;

  const originalJson = res.json.bind(res);
  (res as any).json = (body: unknown, ...args: unknown[]) => {
    captured = body;
    return originalJson(body, ...args);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const ms = Date.now() - start;
    let line = `${req.method} ${path} ${res.statusCode} in ${ms}ms`;
    if (captured) {
      try {
        line += ` :: ${JSON.stringify(captured)}`;
      } catch {
        // ignore stringify issues
      }
    }
    if (line.length > 120) line = line.slice(0, 119) + "…";
    log(line);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Health checks (place BEFORE static catch-all so they always resolve)
  app.get("/api/health", (_req, res) => res.status(200).send("ok"));
  app.get("/health", (_req, res) => res.status(200).send("ok"));

  // Dev uses Vite middleware; prod serves prebuilt assets
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Centralized error handler (keep last)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    try {
      res.status(status).json({ message });
    } catch {
      // ignore write errors
    }
    try {
      log(`ERROR ${status}: ${message}`);
    } catch {
      // ignore log errors
    }
  });

  // Render injects PORT (e.g., 8080). Local fallback: 5000.
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
