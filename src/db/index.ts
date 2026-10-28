import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as { db?: Db };

// Connexion créée au premier usage : le build Docker n'a pas de DATABASE_URL.
export function getDb() {
  if (!globalForDb.db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL n'est pas défini");
    const pool = mysql.createPool({ uri: url, connectionLimit: 10 });
    globalForDb.db = drizzle(pool, { schema, mode: "default" });
  }
  return globalForDb.db;
}
