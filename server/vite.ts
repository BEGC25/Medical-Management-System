// server/vite.ts
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
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html",
      );

      // always reload the index.html file from disk in case it changes
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

export function serveStatic(app: Express) {
  // We’ll try the two most common locations:
  //   1) public/        (root level)
  //   2) client/dist/   (Vite default when root = client)
  const candidates = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "client", "dist"),
  ];

  let distPath: string | null = null;

  for (const candidate of candidates) {
    const indexHtml = path.join(candidate, "index.html");
    if (fs.existsSync(indexHtml)) {
      distPath = candidate;
      break;
    }
  }

  if (!distPath) {
    const msg =
      '❌ Could not find a built client. Expected "public/index.html" or "client/dist/index.html". Make sure "npm run build" ran successfully.';
    console.error(msg);
    // Still mount a simple 500 handler so you don’t just see plain "Not Found"
    app.get("*", (_req, res) => {
      res.status(500).send(msg);
    });
    return;
  }

  log(`[STATIC] Serving static assets from: ${distPath}`);

  // Serve JS/CSS/assets
  app.use(express.static(distPath));

  // SPA fallback for "/", "/patients", etc.
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath!, "index.html"));
  });
}
