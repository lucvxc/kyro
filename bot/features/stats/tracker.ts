import { eq, sql } from "drizzle-orm";
import type { Context, Middleware } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { botStats, guildStats, statDays } from "../../db/schema.ts";

type Key =
  | "messages"
  | "commands"
  | "reactions"
  | "deleted"
  | "edited"
  | "attachments"
  | "links"
  | "voiceSeconds"
  | "membersJoined"
  | "membersLeft"
  | "moderationActions";
type Counts = Record<Key, number> & {
  commandCounts: Record<string, number>;
  peakVoice: number;
};

const guilds = new Map<string, Counts>();
const days = new Map<string, { guildId: string | null; value: Counts }>();
let global: Counts = {
  messages: 0,
  commands: 0,
  reactions: 0,
  deleted: 0,
  edited: 0,
  attachments: 0,
  links: 0,
  voiceSeconds: 0,
  membersJoined: 0,
  membersLeft: 0,
  moderationActions: 0,
  commandCounts: {},
  peakVoice: 0,
};
let timer: ReturnType<typeof setInterval> | undefined;
let flushing: Promise<void> | undefined;

export function track(guildId: string | null, key: Key, count = 1) {
  global[key] += count;
  if (guildId) current(guildId)[key] += count;
}

export function peak(guildId: string, count: number) {
  const value = current(guildId);
  value.peakVoice = Math.max(value.peakVoice, count);
}

export const trackCommand: Middleware = async (ctx: Context, next) => {
  await next();
  global.commands += 1;
  global.commandCounts[ctx.command.name] =
    (global.commandCounts[ctx.command.name] ?? 0) + 1;
  if (ctx.guild) {
    const value = current(ctx.guild.id);
    value.commands += 1;
    value.commandCounts[ctx.command.name] =
      (value.commandCounts[ctx.command.name] ?? 0) + 1;
  }
};

export function start() {
  if (timer) return;
  timer = setInterval(() => void flush(), 30_000);
  timer.unref?.();
  void ensureGlobal();
}

export function flush() {
  return (flushing ??= runFlush().finally(() => {
    flushing = undefined;
  }));
}

async function runFlush() {
  const pendingDays = [...days.values()];
  days.clear();
  for (const item of pendingDays)
    await saveDay(item.guildId, item.value).catch(() =>
      queueDay(item.guildId, item.value),
    );
  const batch = [...guilds.entries()];
  guilds.clear();
  for (const [guildId, value] of batch) {
    await saveGuild(guildId, value).catch(() => merge(guildId, value));
  }
  if (!batch.length && !hasCounts(global)) return;
  const pending = global;
  global = empty();
  await saveGlobal(pending).catch(() => combine(global, pending));
}

function current(guildId: string) {
  let value = guilds.get(guildId);
  if (!value) {
    value = empty();
    guilds.set(guildId, value);
  }
  return value;
}

function merge(guildId: string, source: Counts) {
  const target = current(guildId);
  for (const key of keys) target[key] += source[key];
  target.peakVoice = Math.max(target.peakVoice, source.peakVoice);
  for (const [name, count] of Object.entries(source.commandCounts))
    target.commandCounts[name] = (target.commandCounts[name] ?? 0) + count;
}

async function saveGuild(guildId: string, value: Counts) {
  const [row] = await db
    .select({ commandCounts: guildStats.commandCounts })
    .from(guildStats)
    .where(eq(guildStats.guildId, guildId))
    .limit(1);
  const commandCounts = addCounts(row?.commandCounts, value.commandCounts);
  await db
    .insert(guildStats)
    .values({ guildId, ...value, commandCounts })
    .onConflictDoUpdate({
      target: guildStats.guildId,
      set: {
        ...increments(guildStats, value),
        peakVoice: sql`greatest(${guildStats.peakVoice}, ${value.peakVoice})`,
        commandCounts,
        updatedAt: new Date(),
      },
    });
  await saveDay(guildId, value).catch(() => queueDay(guildId, value));
}

async function saveGlobal(total: Counts) {
  const [row] = await db
    .select({ commandCounts: botStats.commandCounts })
    .from(botStats)
    .where(eq(botStats.id, 1))
    .limit(1);
  const commandCounts = addCounts(row?.commandCounts, total.commandCounts);
  await db
    .insert(botStats)
    .values({ id: 1, ...total, commandCounts })
    .onConflictDoUpdate({
      target: botStats.id,
      set: {
        ...increments(botStats, total),
        commandCounts,
        updatedAt: new Date(),
      },
    });
  await saveDay(null, total).catch(() => queueDay(null, total));
}

async function saveDay(guildId: string | null, value: Counts) {
  const day = new Date().toISOString().slice(0, 10);
  const id = `${guildId ?? "global"}:${day}`;
  const [row] = await db
    .select({ commandCounts: statDays.commandCounts })
    .from(statDays)
    .where(eq(statDays.id, id))
    .limit(1);
  const commandCounts = addCounts(row?.commandCounts, value.commandCounts);
  await db
    .insert(statDays)
    .values({ id, guildId, day, ...value, commandCounts })
    .onConflictDoUpdate({
      target: statDays.id,
      set: {
        ...increments(statDays, value),
        commandCounts,
        updatedAt: new Date(),
      },
    });
}

function queueDay(guildId: string | null, value: Counts) {
  const id = `${guildId ?? "global"}:${new Date().toISOString().slice(0, 10)}`;
  const current = days.get(id);
  if (current) combine(current.value, value);
  else days.set(id, { guildId, value: structuredClone(value) });
}

function increments(
  table: typeof guildStats | typeof botStats | typeof statDays,
  value: Counts,
) {
  return Object.fromEntries(
    keys.map((key) => [key, sql`${table[key]} + ${value[key]}`]),
  );
}

function combine(target: Counts, source: Counts) {
  for (const key of keys) target[key] += source[key];
  for (const [name, count] of Object.entries(source.commandCounts))
    target.commandCounts[name] = (target.commandCounts[name] ?? 0) + count;
  return target;
}

function addCounts(
  current: Record<string, number> = {},
  added: Record<string, number>,
) {
  const value = { ...current };
  for (const [name, count] of Object.entries(added))
    value[name] = (value[name] ?? 0) + count;
  return value;
}

function hasCounts(value: Counts) {
  return (
    keys.some((key) => value[key] > 0) ||
    Object.keys(value.commandCounts).length > 0
  );
}

async function ensureGlobal() {
  await db
    .insert(botStats)
    .values({ id: 1 })
    .onConflictDoUpdate({
      target: botStats.id,
      set: { startedAt: new Date(), updatedAt: new Date() },
    });
}

const keys: Key[] = [
  "messages",
  "commands",
  "reactions",
  "deleted",
  "edited",
  "attachments",
  "links",
  "voiceSeconds",
  "membersJoined",
  "membersLeft",
  "moderationActions",
];
const empty = (): Counts => ({
  messages: 0,
  commands: 0,
  reactions: 0,
  deleted: 0,
  edited: 0,
  attachments: 0,
  links: 0,
  voiceSeconds: 0,
  membersJoined: 0,
  membersLeft: 0,
  moderationActions: 0,
  commandCounts: {},
  peakVoice: 0,
});
