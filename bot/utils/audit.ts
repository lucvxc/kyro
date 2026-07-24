import type { Guild, GuildAuditLogsResolvable } from "discord.js";
import { audit } from "../../index.ts";

export async function auditActor(
  guild: Guild,
  action: GuildAuditLogsResolvable,
  targetId?: string,
  within = 5_000,
): Promise<{ id: string } | undefined> {
  const entry = await audit(guild, { action, target: targetId, within });
  return entry?.executor ? { id: entry.executor.id } : undefined;
}
