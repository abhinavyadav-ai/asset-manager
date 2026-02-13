import session from "express-session";
import type { Pool } from "pg";

/**
 * Custom PostgreSQL session store that doesn't rely on external files.
 * Replaces connect-pg-simple to avoid __dirname/table.sql issues in esbuild bundles.
 */
export class PgSessionStore extends session.Store {
  private pool: Pool;
  private tableName = "session";
  private pruneInterval: NodeJS.Timer | null = null;

  constructor(options: { pool: Pool; pruneSessionInterval?: number }) {
    super();
    this.pool = options.pool;

    // Auto-prune expired sessions every 15 minutes by default
    const pruneMs = (options.pruneSessionInterval ?? 900) * 1000;
    if (pruneMs > 0) {
      this.pruneInterval = setInterval(() => this.pruneSessions(), pruneMs);
      // Don't keep the process alive just for pruning
      if (this.pruneInterval && typeof this.pruneInterval === "object" && "unref" in this.pruneInterval) {
        (this.pruneInterval as NodeJS.Timeout).unref();
      }
    }

    // Ensure session table exists
    this.ensureTable().catch((err) => {
      console.error("Failed to create session table:", err);
    });
  }

  private async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS "${this.tableName}" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "${this.tableName}_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "${this.tableName}" ("expire");
    `);
  }

  get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void): void {
    this.pool
      .query(`SELECT sess FROM "${this.tableName}" WHERE sid = $1 AND expire >= NOW()`, [sid])
      .then((result) => {
        if (result.rows.length === 0) {
          return callback(null, null);
        }
        callback(null, result.rows[0].sess);
      })
      .catch((err) => callback(err));
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void): void {
    const maxAge = sessionData.cookie?.maxAge;
    const expireMs = maxAge ? maxAge : 86400000; // default 24 hours
    const expire = new Date(Date.now() + expireMs);

    this.pool
      .query(
        `INSERT INTO "${this.tableName}" (sid, sess, expire) VALUES ($1, $2, $3)
         ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3`,
        [sid, JSON.stringify(sessionData), expire]
      )
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    this.pool
      .query(`DELETE FROM "${this.tableName}" WHERE sid = $1`, [sid])
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void): void {
    const maxAge = sessionData.cookie?.maxAge;
    const expireMs = maxAge ? maxAge : 86400000;
    const expire = new Date(Date.now() + expireMs);

    this.pool
      .query(`UPDATE "${this.tableName}" SET expire = $1 WHERE sid = $2`, [expire, sid])
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  private async pruneSessions(): Promise<void> {
    try {
      await this.pool.query(`DELETE FROM "${this.tableName}" WHERE expire < NOW()`);
    } catch (err) {
      console.error("Failed to prune sessions:", err);
    }
  }
}
