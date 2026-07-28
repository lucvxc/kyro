import type {
  Guild,
  GuildAuditLogsEntry,
  GuildAuditLogsResolvable,
} from "discord.js";

export interface AuditQuery {
  action: GuildAuditLogsResolvable;
  target?: string;
  executor?: string;
  within?: number;
  limit?: number;
}

export async function audit(
  guild: Guild,
  query: AuditQuery,
): Promise<GuildAuditLogsEntry | undefined> {
  const logs = await guild
    .fetchAuditLogs({
      type: query.action,
      limit: Math.min(100, Math.max(1, query.limit ?? 6)),
    })
    .catch(() => null);
  const within = query.within ?? 5_000;
  return logs?.entries.find(
    (entry) =>
      (!query.target || entry.targetId === query.target) &&
      (!query.executor || entry.executorId === query.executor) &&
      (within < 0 || Date.now() - entry.createdTimestamp <= within),
  );
}
