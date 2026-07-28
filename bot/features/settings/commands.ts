import type { Message } from "discord.js";
import { eq } from "drizzle-orm";
import { Cache, UserError, type Middleware } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";

type CommandSettings = {
  disabled: readonly string[];
  aliases: Readonly<Record<string, string>>;
};

const cache = new Cache<CommandSettings>({ ttl: 300, max: 10_000 });

export async function getCommandSettings(
  guildId: string,
): Promise<CommandSettings> {
  const cached = cache.get(guildId);
  if (cached) return cached;

  const [guild] = await db
    .select({
      disabled: guilds.disabledCommands,
      aliases: guilds.customAliases,
    })
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1);
  const settings = freeze(guild?.disabled ?? [], guild?.aliases ?? {});
  cache.set(guildId, settings);
  return settings;
}

export async function disableCommand(
  guildId: string,
  name: string,
): Promise<boolean> {
  const current = await getCommandSettings(guildId);
  if (current.disabled.includes(name)) return false;
  await save(guildId, [...current.disabled, name], current.aliases);
  return true;
}

export async function enableCommand(
  guildId: string,
  name: string,
): Promise<boolean> {
  const current = await getCommandSettings(guildId);
  if (!current.disabled.includes(name)) return false;
  await save(
    guildId,
    current.disabled.filter((value) => value !== name),
    current.aliases,
  );
  return true;
}

export async function addAlias(
  guildId: string,
  alias: string,
  command: string,
): Promise<void> {
  const current = await getCommandSettings(guildId);
  await save(guildId, current.disabled, {
    ...current.aliases,
    [alias]: command,
  });
}

export async function removeAlias(
  guildId: string,
  alias: string,
): Promise<boolean> {
  const current = await getCommandSettings(guildId);
  if (!(alias in current.aliases)) return false;
  const aliases = { ...current.aliases };
  delete aliases[alias];
  await save(guildId, current.disabled, aliases);
  return true;
}

export async function getGuildAlias(
  message: Message,
  input: string,
): Promise<string | null> {
  if (!message.guildId) return null;
  const alias = input.trim().split(/\s+/, 1)[0]?.toLowerCase();
  return alias
    ? ((await getCommandSettings(message.guildId)).aliases[alias] ?? null)
    : null;
}

export const blockDisabledCommands: Middleware = async (ctx, next) => {
  if (
    !ctx.guild ||
    !(await getCommandSettings(ctx.guild.id)).disabled.includes(
      ctx.command.name,
    )
  ) {
    await next();
    return;
  }
  throw new UserError(
    `The **${ctx.command.name}** command is disabled in this server.`,
  );
};

async function save(
  guildId: string,
  disabled: readonly string[],
  aliases: Readonly<Record<string, string>>,
): Promise<void> {
  const values = {
    disabledCommands: [...disabled],
    customAliases: { ...aliases },
    updatedAt: new Date(),
  };
  await db
    .insert(guilds)
    .values({ id: guildId, ...values })
    .onConflictDoUpdate({ target: guilds.id, set: values });
  cache.set(guildId, freeze(disabled, aliases));
}

function freeze(
  disabled: readonly string[],
  aliases: Readonly<Record<string, string>>,
): CommandSettings {
  return Object.freeze({
    disabled: Object.freeze([...disabled]),
    aliases: Object.freeze({ ...aliases }),
  });
}
