import mysql from "mysql2/promise";
import { seed } from "./seed";

// Migrations versionnées, appliquées dans l'ordre au démarrage du serveur.
// Ne jamais modifier une migration existante : en ajouter une nouvelle.
const migrations: { id: number; sql: string }[] = [
  {
    id: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS doors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        round_id INT NOT NULL,
        side ENUM('left','right') NOT NULL,
        label VARCHAR(255) NOT NULL,
        description TEXT NULL,
        reveal_title VARCHAR(255) NOT NULL,
        reveal_text TEXT NULL,
        image_url VARCHAR(1024) NULL,
        color VARCHAR(16) NOT NULL DEFAULT '#b45309',
        UNIQUE KEY doors_round_side (round_id, side),
        CONSTRAINT doors_round_fk FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        round_id INT NOT NULL,
        door_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY votes_round (round_id),
        CONSTRAINT votes_round_fk FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
        CONSTRAINT votes_door_fk FOREIGN KEY (door_id) REFERENCES doors(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    id: 2,
    sql: `
      ALTER TABLE rounds ADD COLUMN bad_side ENUM('left','right') NOT NULL DEFAULT 'right' AFTER active;
      ALTER TABLE doors
        ADD COLUMN video_url VARCHAR(1024) NULL AFTER reveal_text,
        MODIFY reveal_title VARCHAR(255) NULL;
    `,
  },
];

async function connectWithRetry(url: string, attempts = 30) {
  for (let i = 1; ; i++) {
    try {
      return await mysql.createConnection({ uri: url, multipleStatements: true });
    } catch (error) {
      if (i >= attempts) throw error;
      console.log(`[db] MySQL indisponible, nouvelle tentative (${i}/${attempts})…`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[db] DATABASE_URL absent, migrations ignorées");
    return;
  }

  const conn = await connectWithRetry(url);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await conn.query<mysql.RowDataPacket[]>("SELECT id FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.id as number));

    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;
      console.log(`[db] Application de la migration ${migration.id}`);
      await conn.query(migration.sql);
      await conn.query("INSERT INTO schema_migrations (id) VALUES (?)", [migration.id]);
    }

    await seed(conn);
  } finally {
    await conn.end();
  }
}
