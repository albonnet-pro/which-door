import type { PoolOptions } from "mysql2/promise";

/**
 * Paramètres de connexion MySQL : DATABASE_URL (dev) ou DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
 * (Docker, accepte n'importe quel caractère dans le mot de passe).
 */
export function dbConfig(): PoolOptions | null {
  if (process.env.DATABASE_URL) return { uri: process.env.DATABASE_URL };
  if (!process.env.DB_HOST) return null;
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}
