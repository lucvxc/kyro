import type { AuditLogEvents } from "discordeno";
import type { DiscordBot } from "../core/Discord.ts";
type AuditLogEntry = Awaited<
  ReturnType<DiscordBot["helpers"]["getAuditLog"]>
>["auditLogEntries"][number];
export interface AuditQuery {
  action: AuditLogEvents;
  target?: string;
  executor?: string;
  within?: number;
  limit?: number;
}
export async function audit(
  bot: DiscordBot,
  guildId: string | bigint,
  query: AuditQuery,
): Promise<AuditLogEntry | undefined> {
  const logs = await bot.helpers
    .getAuditLog(guildId, {
      actionType: query.action,
      limit: Math.min(100, Math.max(1, query.limit ?? 6)),
    })
    .catch(() => null);
  const within = query.within ?? 5_000;
  return logs?.auditLogEntries.find(
    (entry) =>
      (!query.target || entry.targetId === query.target) &&
      (!query.executor || entry.userId === query.executor) &&
      (within < 0 ||
        Date.now() - Number(BigInt(entry.id) >> 22n) - 1_420_070_400_000 <=
          within),
  );
}
