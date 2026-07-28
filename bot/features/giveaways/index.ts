import {
  MessageFlags,
  type Client,
  type Guild,
  type GuildTextBasedChannel,
  type MessageCreateOptions,
} from "discord.js";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import {
  button,
  container,
  dominant,
  thumb,
  UserError,
} from "../../../index.ts";
import { db } from "../../db/database.ts";
import { giveaways } from "../../db/schema.ts";
import { colors } from "../../shared/config/constants.ts";

export async function giveawayCard(
  item: typeof giveaways.$inferSelect,
  guild: Guild,
  ended = false,
) {
  const end = Math.floor(item.endsAt.getTime() / 1_000);
  const icon = guild.iconURL({ extension: "png", size: 256 });
  const accent = icon ? await dominant(icon, colors.default) : colors.default;
  const content = `## ${item.prize}\n-# ${ended ? "Giveaway ended" : `Ends <t:${end}:R>`}\n**Winners** ${item.winnerCount}\n**Entries** ${item.entries.length}\n**Hosted by** <@${item.hostId}>`;
  const body = container()
    .accent(accent)
    .section(content, icon ? thumb(icon) : undefined);
  const view = giveawayUrl(item.id);
  if (!ended) {
    const controls = [
      button({
        id: `giveaway:${item.id}`,
        label: item.entries.length ? `Enter (${item.entries.length})` : "Enter",
        style: "secondary",
        emoji: { name: "🎉" },
      }),
    ];
    if (view)
      controls.push(
        button({ label: "View Entries", style: "link", url: view }),
      );
    body.separator().row(...controls);
  } else if (view) {
    body
      .separator()
      .row(button({ label: "View Entries", style: "link", url: view }));
  }
  return body;
}

export function giveawayUrl(id: string) {
  const base = process.env.SITEURL ?? process.env.CALLBACK;
  if (!base) return null;
  try {
    return new URL(`/giveaway/${id}`, base).toString();
  } catch {
    return null;
  }
}

export async function giveawayMessage(
  item: typeof giveaways.$inferSelect,
  guild: Guild,
  ended = false,
): Promise<MessageCreateOptions> {
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [(await giveawayCard(item, guild, ended)).toJSON()],
  };
}

export async function findGiveaway(ref: string, guildId?: string) {
  const match = or(eq(giveaways.id, ref), eq(giveaways.messageId, ref));
  const where = guildId ? and(eq(giveaways.guildId, guildId), match) : match;
  return (await db.select().from(giveaways).where(where).limit(1))[0];
}

export async function finish(client: Client, ref: string, guildId?: string) {
  const item = await findGiveaway(ref, guildId);
  if (!item) throw new UserError("Giveaway not found.");
  if (item.endedAt) throw new UserError("That giveaway has already ended.");
  const winners = pick(item.entries, item.winnerCount);
  const ended = { ...item, endedAt: new Date() };
  await db
    .update(giveaways)
    .set({ endedAt: ended.endedAt })
    .where(eq(giveaways.id, item.id));
  const channel = client.channels.cache.get(item.channelId);
  if (channel?.isSendable() && !channel.isDMBased()) {
    const msg = await channel.messages.fetch(item.messageId).catch(() => null);
    const guild = client.guilds.cache.get(item.guildId);
    if (guild)
      await msg
        ?.edit({
          flags: MessageFlags.IsComponentsV2,
          components: [(await giveawayCard(ended, guild, true)).toJSON()],
        })
        .catch(() => undefined);
    await channel.send(
      winners.length
        ? `🎉 ${winners.map((user) => `<@${user}>`).join(", ")} won **${item.prize}**!`
        : `No valid entries for **${item.prize}**.`,
    );
  }
  return winners;
}

export async function startGiveaway(
  channel: GuildTextBasedChannel,
  hostId: string,
  prize: string,
  endsAt: Date,
  winnerCount: number,
) {
  const id = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const item = {
    id,
    guildId: channel.guild.id,
    channelId: channel.id,
    messageId: "pending",
    hostId,
    prize,
    winnerCount,
    entries: [] as string[],
    endsAt,
  };
  const msg = await channel.send(
    await giveawayMessage(
      { ...item, endedAt: null, createdAt: new Date() },
      channel.guild,
    ),
  );
  await db.insert(giveaways).values({ ...item, messageId: msg.id });
  return { id, msg };
}

let timer: ReturnType<typeof setInterval> | undefined;
export function startGiveaways(client: Client) {
  if (timer) return;
  const run = async () => {
    const due = await db
      .select({ id: giveaways.id })
      .from(giveaways)
      .where(and(lte(giveaways.endsAt, new Date()), isNull(giveaways.endedAt)))
      .limit(50)
      .catch(() => []);
    for (const item of due)
      await finish(client, item.id).catch(() => undefined);
  };
  timer = setInterval(() => void run(), 10_000);
  timer.unref?.();
  void run();
}

export const pick = (entries: string[], count: number) =>
  [...entries]
    .sort(() => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32 - 0.5)
    .slice(0, count);
