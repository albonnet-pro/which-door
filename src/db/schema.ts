import { relations } from "drizzle-orm";
import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  position: int("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  // La porte piégée, choisie dans l'admin
  badSide: mysqlEnum("bad_side", ["left", "right"]).notNull().default("right"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const doors = mysqlTable("doors", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  side: mysqlEnum("side", ["left", "right"]).notNull(),
  // Le dilemme affiché sur la porte
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  // Ce qu'il y a derrière la porte, révélé après le choix
  revealTitle: varchar("reveal_title", { length: 255 }),
  revealText: text("reveal_text"),
  videoUrl: varchar("video_url", { length: 1024 }),
  imageUrl: varchar("image_url", { length: 1024 }),
  color: varchar("color", { length: 16 }).notNull().default("#b45309"),
});

export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("round_id")
    .notNull()
    .references(() => rounds.id, { onDelete: "cascade" }),
  doorId: int("door_id")
    .notNull()
    .references(() => doors.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const roundsRelations = relations(rounds, ({ many }) => ({
  doors: many(doors),
}));

export const doorsRelations = relations(doors, ({ one }) => ({
  round: one(rounds, { fields: [doors.roundId], references: [rounds.id] }),
}));

export type Round = typeof rounds.$inferSelect;
export type Door = typeof doors.$inferSelect;
export type DoorSide = Door["side"];
