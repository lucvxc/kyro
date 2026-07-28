import type { Client, Guild, User } from "discord.js";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/database.ts";
import { giveaways } from "../../db/schema.ts";

export function giveawaysApi(client: Client) {
  const app = new Hono();

  app.get("/:id", async (ctx) => {
    const [item] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, ctx.req.param("id")))
      .limit(1);
    if (!item) return ctx.json({ error: "Giveaway not found" }, 404);
    const guild = client.guilds.cache.get(item.guildId);
    const channel = guild?.channels.cache.get(item.channelId);
    const host = client.users.cache.get(item.hostId);
    return ctx.json({
      giveaway: view(item),
      guild: guildView(guild),
      channel: channel
        ? {
            id: channel.id,
            name: "name" in channel ? channel.name : null,
            type: channel.type,
          }
        : null,
      host: userView(host, item.hostId),
      participants: item.entries.map((id) =>
        userView(client.users.cache.get(id), id),
      ),
      totalEntries: item.entries.length,
    });
  });

  app.get("/guilds/:guildId", async (ctx) => {
    const guildId = ctx.req.param("guildId");
    if (!client.guilds.cache.has(guildId))
      return ctx.json({ error: "Guild not found" }, 404);
    const rows = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.guildId, guildId))
      .orderBy(desc(giveaways.createdAt))
      .limit(100);
    return ctx.json({ giveaways: rows.map(view) });
  });

  return app;
}

function view(item: typeof giveaways.$inferSelect) {
  return {
    id: item.id,
    guildId: item.guildId,
    channelId: item.channelId,
    messageId: item.messageId,
    hostId: item.hostId,
    prize: item.prize,
    winners: item.winnerCount,
    winnerCount: item.winnerCount,
    endTime: item.endsAt.getTime(),
    endsAt: item.endsAt.toISOString(),
    ended: Boolean(item.endedAt),
    endedAt: item.endedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    totalEntries: item.entries.length,
  };
}

function userView(user: User | undefined, id: string) {
  return user
    ? {
        id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.displayAvatarURL({ extension: "png", size: 256 }),
        bot: user.bot,
      }
    : { id, username: null, displayName: null, avatar: null, bot: false };
}

function guildView(guild: Guild | undefined) {
  return guild
    ? {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ extension: "png", size: 256 }),
        memberCount: guild.memberCount,
      }
    : null;
}
