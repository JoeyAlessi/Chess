import { integer, pgTable, varchar, uuid, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255}).unique()
});

export const gameTable = pgTable("games", {
  id: uuid().primaryKey().defaultRandom(),
  whitePlayerId: integer().references(() => usersTable.id, {onDelete: "cascade"}).notNull(),
  blackPlayerId: integer().references(() => usersTable.id, {onDelete: "cascade"}).notNull(),
  winnerId: integer().references(() => usersTable.id, {onDelete: "set null"}),
  createdAt: timestamp({ withTimezone: true}).defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow()
});

