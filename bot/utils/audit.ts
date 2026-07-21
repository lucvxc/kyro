import type { Guild } from "discord.js";
import type { GuildAuditLogsResolvable } from "discord.js";

export async function auditActor(
  guild: Guild,
  action: GuildAuditLogsResolvable,
  targetId: string,
  within = 5_000,
): Promise<{ id: string } | undefined> {
  const logs = await guild.fetchAuditLogs({ type: action, limit: 6 }).catch(() => null);
  const entry = logs?.entries.find(value =>
    value.targetId === targetId && Date.now() - value.createdTimestamp <= within);
  return entry?.executor ? { id: entry.executor.id } : undefined;
}
