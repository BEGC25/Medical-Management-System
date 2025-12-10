// Medical-Management-System/server/vite.ts

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

const viteLogger = createLogger();

/**
 * ESM-safe __dirname / __filename
 * Works in Node 18+ and after esbuild bundling.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      // In dev, just log the error; don't hard-exit.
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // In dev we always read client/index.html from disk.
      // Project layout:
      //   /client/index.html
      //   /server/vite.ts
      //   /server/index.ts
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Bust cache for main.tsx
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  /**
   * In production, after bundling:
   *   __dirname = <project-root>/dist
   *
   * There are two common layouts we want to support:
   *
   * 1) Vite builds into /server/public
   *    - outDir: "../server/public" from the /client config
   *    => static path: <project-root>/server/public
   *
   * 2) Vite builds into /public at the project root
   *    - outDir: "../public"
   *    => static path: <project-root>/public
   */
  const candidatePaths = [
    // Most likely for your template: server/public
    path.resolve(__dirname, "..", "server", "public"),
    // Alternative layout: public at project root
    path.resolve(__dirname, "..", "public"),
  ];

  const staticRoot = candidatePaths.find((p) => fs.existsSync(p));

  if (!staticRoot) {
    // ⚠️ Important: DO NOT crash the process here.
    // Let the API run even if the frontend hasn't been built yet.
    log(
      `⚠️ No static client build found. Checked: ${candidatePaths.join(
        ", ",
      )}. Backend API will still run, but UI assets are missing.`,
      "static",
    );
    return;
  }

  log(`Serving static assets from: ${staticRoot}`, "static");

  // Serve JS/CSS/assets
  app.use(express.static(staticRoot));

  // SPA fallback
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(staticRoot, "index.html"));
  });
}
