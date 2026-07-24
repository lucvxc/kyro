import type { Client } from "discord.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { lastfmApi } from "./routes/lastfm.ts";

export function startApi(client: Client) {
  if (!process.env.API_URL) return;

  const app = new Hono();
  app.use("*", cors());
  app.get("/", (ctx) => ctx.text("June API"));
  app.route("/lastfm", lastfmApi(client));

  return Bun.serve({
    hostname: "0.0.0.0",
    port: 4046,
    fetch: app.fetch,
  });
}
