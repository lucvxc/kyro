import type { Client } from "discord.js";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/database.ts";
import { botStats, guildStats, statDays } from "../../db/schema.ts";
import { flush } from "../../features/stats/tracker.ts";
import { dashboardAuth } from "../auth.ts";

export function statsApi(client: Client) {
  const app = new Hono();
  app.get("/", async (ctx) => {
    await flush();
    const [stats] = await db
      .select()
      .from(botStats)
      .where(eq(botStats.id, 1))
      .limit(1);
    return ctx.json({
      scope: "global",
      live: {
        guilds: client.guilds.cache.size,
        users: client.guilds.cache.reduce(
          (sum, guild) => sum + guild.memberCount,
          0,
        ),
      },
      stats: stats ?? null,
    });
  });
  app.get("/guilds/:id", async (ctx) => {
    const denied = dashboardAuth(ctx);
    if (denied) return denied;
    const id = ctx.req.param("id");
    if (!client.guilds.cache.has(id))
      return ctx.json({ error: "Guild not found" }, 404);
    await flush();
    const [stats] = await db
      .select()
      .from(guildStats)
      .where(eq(guildStats.guildId, id))
      .limit(1);
    return ctx.json({ scope: "guild", guildId: id, stats: stats ?? null });
  });
  app.get("/history", async (ctx) => {
    const denied = dashboardAuth(ctx);
    if (denied) return denied;
    const rows = await db
      .select()
      .from(statDays)
      .where(
        and(
          isNull(statDays.guildId),
          gte(statDays.day, dayStart(ctx.req.query("days"))),
        ),
      )
      .orderBy(desc(statDays.day));
    return ctx.json({ scope: "global", history: rows });
  });
  app.get("/guilds/:id/history", async (ctx) => {
    const denied = dashboardAuth(ctx);
    if (denied) return denied;
    const id = ctx.req.param("id");
    if (!client.guilds.cache.has(id))
      return ctx.json({ error: "Guild not found" }, 404);
    const rows = await db
      .select()
      .from(statDays)
      .where(
        and(
          eq(statDays.guildId, id),
          gte(statDays.day, dayStart(ctx.req.query("days"))),
        ),
      )
      .orderBy(desc(statDays.day));
    return ctx.json({ scope: "guild", guildId: id, history: rows });
  });
  return app;
}

function dayStart(value?: string) {
  const days = Math.min(365, Math.max(1, Number(value) || 30));
  return new Date(Date.now() - (days - 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
