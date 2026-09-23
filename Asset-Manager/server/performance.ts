/**
 * Database performance indexes.
 * Run these via: npx tsx server/migrate-indexes.ts
 * Or they auto-run on server startup.
 */
import { pool } from "./db";

export async function ensureIndexes() {
  const client = await pool.connect();
  try {
    console.log("[perf] Creating database indexes if not exist...");

    // Products: frequently queried by isActive + ordered by createdAt
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_active_created
      ON products (is_active, created_at DESC);
    `);

    // Orders: lookup by order_number (unique but explicit index helps)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_order_number
      ON orders (order_number);
    `);

    // Orders: sorted by created_at for admin listing
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at
      ON orders (created_at DESC);
    `);

    // Reviews: product lookup + approved filter
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
      ON reviews (product_id, is_approved) WHERE is_approved = true;
    `);

    // Coupons: lookup by code + active status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_coupons_code_active
      ON coupons (code, is_active) WHERE is_active = true;
    `);

    // Flash sales: active + date range
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_flash_sales_active_dates
      ON flash_sales (is_active, start_date, end_date) WHERE is_active = true;
    `);

    // Sessions: expiry cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expire
      ON session (expire);
    `);

    console.log("[perf] Database indexes ensured.");
  } catch (err) {
    // Indexes are best-effort; don't crash server if they fail
    console.warn("[perf] Warning: Could not create some indexes:", (err as Error).message);
  } finally {
    client.release();
  }
}
