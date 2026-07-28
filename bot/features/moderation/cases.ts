import { MessageFlags } from "discord.js";
import { and, desc, eq, ilike, max } from "drizzle-orm";
import { container, type Context, type Middleware } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { cases, guilds } from "../../db/schema.ts";
import { colors } from "../../shared/config/constants.ts";
import { track } from "../stats/tracker.ts";

const actions = new Set([
  "ban",
  "kick",
  "softban",
  "timeout",
  "untimeout",
  "warn",
  "jail add",
  "jail remove",
  "unban",
]);

export const trackCases: Middleware = async (ctx: Context, next) => {
  await next();
  if (!ctx.guild || !actions.has(ctx.command.name)) return;
  const user = ctx.user("user");
  if (!user) return;
  const item = await addCase({
    guildId: ctx.guild.id,
    userId: user.id,
    moderatorId: ctx.author.id,
    action: ctx.command.name,
    reason: ctx.string("reason") ?? "No reason provided",
    duration: ctx.string("duration") ?? null,
  });
  await sendCaseLog(ctx.guild, item);
  track(ctx.guild.id, "moderationActions");
};

export async function addCase(
  entry: Omit<typeof cases.$inferInsert, "number">,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [row] = await db
      .select({ value: max(cases.number) })
      .from(cases)
      .where(eq(cases.guildId, entry.guildId));
    try {
      return (
        await db
          .insert(cases)
          .values({ ...entry, number: (row?.value ?? 0) + 1 })
          .returning()
      )[0]!;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Could not create moderation case.");
}

export async function getCase(guildId: string, number: number) {
  return (
    await db
      .select()
      .from(cases)
      .where(and(eq(cases.guildId, guildId), eq(cases.number, number)))
      .limit(1)
  )[0];
}

export async function listCases(guildId: string, userId?: string) {
  const where = userId
    ? and(eq(cases.guildId, guildId), eq(cases.userId, userId))
    : eq(cases.guildId, guildId);
  return db
    .select()
    .from(cases)
    .where(where)
    .orderBy(desc(cases.number))
    .limit(15);
}

export async function searchCases(guildId: string, query: string) {
  const id = query.replace(/\D/g, "");
  const where =
    id.length >= 17
      ? and(eq(cases.guildId, guildId), eq(cases.userId, id))
      : and(eq(cases.guildId, guildId), ilike(cases.action, `%${query}%`));
  return db
    .select()
    .from(cases)
    .where(where)
    .orderBy(desc(cases.number))
    .limit(25);
}

export async function sendCaseLog(
  guild: Context["guild"],
  item: typeof cases.$inferSelect,
  note?: string,
) {
  if (!guild) return;
  const [settings] = await db
    .select({ channelId: guilds.caseLogChannelId })
    .from(guilds)
    .where(eq(guilds.id, guild.id))
    .limit(1);
  const channel = settings?.channelId
    ? guild.channels.cache.get(settings.channelId)
    : null;
  if (!channel?.isSendable()) return;
  const view = container()
    .accent(colors.default)
    .text(
      `## Moderation Case ${item.number}\n-# ${item.action} · <t:${Math.floor(item.createdAt.getTime() / 1000)}:f>\n**User** <@${item.userId}>\n**Moderator** <@${item.moderatorId}>\n**Reason** ${item.reason}${item.duration ? `\n**Duration** ${item.duration}` : ""}${note ? `\n-# ${note}` : ""}`,
    );
  await channel
    .send({
      flags: MessageFlags.IsComponentsV2,
      components: [view.toJSON()],
      allowedMentions: { parse: [] },
    })
    .catch(() => undefined);
}
