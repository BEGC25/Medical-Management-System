// Medical-Management-System/server/index.ts

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple API request logger (captures JSON responses)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
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

  // Centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // rethrow so it shows in Render logs
    throw err;
  });

  // Only mount Vite dev middleware in development;
  // otherwise serve the pre-built static assets
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Healthcheck for Render/uptime monitors
  app.get("/health", (_req, res) => res.status(200).send("ok"));

  // Use Render's injected PORT (e.g., 8080); fallback to 5000 for local dev
  const port = Number(process.env.PORT) || 5000;
  const host = "0.0.0.0";

  server.listen(
    {
      port,
      host,
      // reusePort not supported on Windows, but safe here
      reusePort: process.platform !== "win32",
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
