import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Hashed assets (JS, CSS with content hash in filename) — long cache
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: "1y",          // 1 year cache for fingerprinted files
      immutable: true,       // tell browser these never change
      etag: true,
      lastModified: false,
    }),
  );

  // Images and other public files — moderate cache
  app.use(
    "/images",
    express.static(path.join(distPath, "images"), {
      maxAge: "7d",
      etag: true,
    }),
  );

  // Root-level static files (index.html, favicon, etc.) — short cache
  app.use(
    express.static(distPath, {
      maxAge: "1h",
      etag: true,
    }),
  );

  // SPA fallback — index.html should not be cached aggressively
  app.use("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
