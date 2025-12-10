// Medical-Management-System/server/vite.ts

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Development: attach Vite dev middlewares and serve client/index.html
 */
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
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const rootDir = process.cwd();

    try {
      const clientTemplate = path.resolve(rootDir, "client", "index.html");

      // Always reload index.html from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
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

/**
 * Production: serve pre-built static assets.
 *
 * We **do not** rely on import.meta.dirname (which becomes undefined in the
 * bundled dist/index.js). Instead we use process.cwd() and look for the
 * built client in a few common locations.
 */
export function serveStatic(app: Express) {
  const rootDir = process.cwd();

  const candidates = [
    // Preferred: Vite build outDir = "dist/public"
    path.join(rootDir, "dist", "public"),
    // Alternative: build outDir = "server/public"
    path.join(rootDir, "server", "public"),
    // Fallbacks
    path.join(rootDir, "public"),
    path.join(rootDir, "client", "dist"),
  ];

  let distPath: string | undefined;

  for (const candidate of candidates) {
    const indexFile = path.join(candidate, "index.html");
    if (fs.existsSync(indexFile)) {
      distPath = candidate;
      break;
    }
  }

  if (!distPath) {
    throw new Error(
      `Could not find built client index.html. Checked:\n` +
        candidates.map((c) => ` - ${c}`).join("\n"),
    );
  }

  log(`Serving static client from: ${distPath}`, "vite");

  app.use(express.static(distPath));

  // Fall through to index.html for client-side routing
  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPath!, "index.html"));
  });
}
