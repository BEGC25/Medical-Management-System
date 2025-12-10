// Medical-Management-System/server/vite.ts

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Base paths (work in both dev + bundled prod)
const __filename = fileURLToPath(import.meta.url);
const THIS_DIR = path.dirname(__filename);
// When running with tsx:  THIS_DIR ≈ /.../server
// When running bundled:   THIS_DIR ≈ /.../dist
const PROJECT_ROOT = path.resolve(THIS_DIR, "..");

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
 * DEV: attach Vite middleware (tsx, hot reload).
 * Only used when NODE_ENV=development.
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

    try {
      // client/index.html in the repo root
      const clientTemplate = path.resolve(PROJECT_ROOT, "client", "index.html");

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
 * PROD: serve the static Vite build.
 * The Vite config builds to dist/public:
 *   outDir: "dist/public"
 */
export function serveStatic(app: Express) {
  // Try a few possible locations, then pick the first that actually has index.html
  const candidates = [
    // When THIS_DIR is dist (bundled server):
    path.resolve(THIS_DIR, "public"),
    // When THIS_DIR is server/ or project root:
    path.resolve(PROJECT_ROOT, "dist/public"),
    // Legacy / safety:
    path.resolve(PROJECT_ROOT, "public"),
  ];

  let staticRoot: string | null = null;
  let indexPath = "";

  for (const dir of candidates) {
    const candidateIndex = path.join(dir, "index.html");
    if (fs.existsSync(candidateIndex)) {
      staticRoot = dir;
      indexPath = candidateIndex;
      break;
    }
  }

  if (!staticRoot) {
    console.error(
      [
        "❌ Could not find a built client index.html.",
        "Searched in:",
        ...candidates.map((c) => `  - ${c}`),
        'Make sure "npm run build" completed successfully and was pushed.',
      ].join("\n"),
    );

    // Return a clear error instead of a generic 404
    app.get("*", (_req, res) => {
      res
        .status(500)
        .send("Client build not found on the server. Please contact the admin.");
    });
    return;
  }

  log(`Serving static client from ${staticRoot}`, "static");

  // Serve assets
  app.use(express.static(staticRoot));

  // SPA fallback: any unknown route -> index.html
  app.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
