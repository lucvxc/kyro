import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guilds = pgTable("guilds", {
  id: text("id").primaryKey(),
  prefix: text("prefix").notNull().default("$"),
});
