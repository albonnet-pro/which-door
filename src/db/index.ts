import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { dbConfig } from "./config";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as { db?: Db };

// Connexion créée au premier usage : le build Docker n'a pas de configuration MySQL.
export function getDb() {
  if (!globalForDb.db) {
    const config = dbConfig();
    if (!config) throw new Error("Connexion MySQL non configurée (DATABASE_URL ou DB_HOST)");
    const pool = mysql.createPool({ ...config, connectionLimit: 10 });
    globalForDb.db = drizzle(pool, { schema, mode: "default" });
  }
  return globalForDb.db;
}
