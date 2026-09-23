import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import compression from "compression";
import { ensureIndexes } from "./performance";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// --- Performance: Gzip/Brotli compression for all responses ---
app.use(
  compression({
    level: 6, // balanced speed vs compression
    threshold: 1024, // only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't accept it
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// --- Performance: API caching headers for public GET endpoints ---
app.use((req, res, next) => {
  if (req.method === "GET" && req.path.startsWith("/api")) {
    // Short cache for frequently-polled public data
    const publicPatterns = [
      /^\/api\/products$/,
      /^\/api\/products\/\d+$/,
      /^\/api\/products\/\d+\/reviews$/,
      /^\/api\/flash-sales\/active$/,
      /^\/api\/bulk-discounts\/active$/,
      /^\/api\/razorpay\/config$/,
      /^\/api\/settings\/[^/]+$/,
    ];
    const isPublic = publicPatterns.some((p) => p.test(req.path));
    if (isPublic) {
      // 60s stale-while-revalidate = fast repeat loads, background refresh
      res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=60");
    } else {
      // Authenticated / private routes — no cache
      res.setHeader("Cache-Control", "private, no-cache");
    }
  }
  next();
});

(async () => {
  // Create DB indexes in background (non-blocking)
  ensureIndexes().catch(() => {});

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

const PORT = parseInt(process.env.PORT || "5000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
})();
