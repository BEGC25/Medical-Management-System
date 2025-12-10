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
      // In dev, we always read client/index.html from disk
      // Folder structure (project root):
      //   /client/index.html
      //   /server/vite.ts
      //   /dist/...
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Bust Vite HMR cache by appending a nanoid version
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
   * In production:
   * - `vite build` outputs static assets to `public/` at the **project root**
   * - `esbuild` bundles the server to `dist/index.js`
   *
   * After bundling, this file lives in:  dist/vite.js
   * So `__dirname` === `<project-root>/dist`
   * Our static folder is one level up: `<project-root>/public`
   */
  const publicPath = path.resolve(__dirname, "..", "public");

  if (!fs.existsSync(publicPath)) {
    throw new Error(
      `Could not find the build directory: ${publicPath}. ` +
        `Make sure to run "vite build" from the project root before starting in production.`,
    );
  }

  // Serve all static assets (JS, CSS, images, etc.)
  app.use(express.static(publicPath));

  // SPA fallback - always send index.html
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}
