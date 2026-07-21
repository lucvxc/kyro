import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./bot/db/schema.ts",
  out: "./bot/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.POSTGRESURL! },
});
