import type { Client } from "discord.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { lastfmApi } from "./routes/lastfm.ts";
import { statsApi } from "./routes/stats.ts";
import { giveawaysApi } from "./routes/giveaways.ts";

export function startApi(client: Client) {
  const app = createApi(client);

  const server = Bun.serve({
    hostname: "0.0.0.0",
    port: Number(process.env.PORT ?? 5569),
    fetch: app.fetch,
  });

  console.log(`API on port ${server.port}`);
  return server;
}

export function createApi(client: Client) {
  const app = new Hono();
  app.use("*", cors());
  app.get("/", (ctx) => ctx.text("June API"));
  app.route("/lastfm", lastfmApi(client));
  app.route("/stats", statsApi(client));
  const giveaways = giveawaysApi(client);
  app.route("/giveaways", giveaways);
  app.route("/v2/june/giveaway", giveaways);

  return app;
}
