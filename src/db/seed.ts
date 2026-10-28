import type mysql from "mysql2/promise";

type SeedDoor = {
  label: string;
  description?: string;
  revealTitle: string;
  revealText?: string;
  color: string;
};

const examples: { title: string; badSide: "left" | "right"; left: SeedDoor; right: SeedDoor }[] = [
  {
    title: "Le dîner",
    badSide: "right",
    left: {
      label: "Dîner avec ton idole",
      description: "Mais tu ne peux parler qu'en chantant.",
      revealTitle: "Un dîner à 3 étoiles",
      revealText: "Ton idole adore la comédie musicale : soirée légendaire.",
      color: "#b91c1c",
    },
    right: {
      label: "Dîner avec tes potes",
      description: "Mais c'est toi qui paies l'addition.",
      revealTitle: "L'addition fait 1 200 €",
      revealText: "Quelqu'un a commandé la bouteille à 800 €…",
      color: "#1d4ed8",
    },
  },
  {
    title: "Les vacances",
    badSide: "right",
    left: {
      label: "Une semaine aux Maldives",
      description: "Sans téléphone.",
      revealTitle: "Paradis absolu",
      revealText: "Tu redécouvres le plaisir de ne rien faire.",
      color: "#0f766e",
    },
    right: {
      label: "Un mois à Paris",
      description: "Avec ton téléphone, mais en août.",
      revealTitle: "Canicule et touristes",
      revealText: "La ville est vide… sauf les files d'attente.",
      color: "#7c3aed",
    },
  },
  {
    title: "Le pouvoir",
    badSide: "left",
    left: {
      label: "Lire dans les pensées",
      description: "Mais tu ne peux jamais l'éteindre.",
      revealTitle: "Le bruit permanent",
      revealText: "Tu sais enfin ce que pense ton chat. C'est décevant.",
      color: "#c2410c",
    },
    right: {
      label: "Être invisible",
      description: "Mais seulement quand personne ne te regarde.",
      revealTitle: "Un pouvoir… discutable",
      revealText: "Techniquement, tu l'étais déjà.",
      color: "#4d7c0f",
    },
  },
];

export async function seed(conn: mysql.Connection) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS n FROM rounds");
  if (Number(rows[0].n) > 0) return;

  console.log("[db] Base vide : insertion de rounds d'exemple");
  for (const [index, example] of examples.entries()) {
    const [result] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO rounds (title, position, bad_side) VALUES (?, ?, ?)",
      [example.title, index, example.badSide],
    );
    for (const side of ["left", "right"] as const) {
      const door = example[side];
      await conn.query(
        `INSERT INTO doors (round_id, side, label, description, reveal_title, reveal_text, color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [result.insertId, side, door.label, door.description ?? null, door.revealTitle, door.revealText ?? null, door.color],
      );
    }
  }
}
