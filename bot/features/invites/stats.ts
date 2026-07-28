import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/database.ts";
import { inviteMembers } from "../../db/schema.ts";

export async function inviteStats(guildId: string, inviterId: string) {
  const [row] = await db
    .select({
      total: count(),
      active: count(sql`case when ${inviteMembers.leftAt} is null then 1 end`),
      left: count(
        sql`case when ${inviteMembers.leftAt} is not null then 1 end`,
      ),
      fake: count(sql`case when ${inviteMembers.fake} then 1 end`),
    })
    .from(inviteMembers)
    .where(
      and(
        eq(inviteMembers.guildId, guildId),
        eq(inviteMembers.inviterId, inviterId),
      ),
    );
  return row ?? { total: 0, active: 0, left: 0, fake: 0 };
}

export function inviteLeaders(guildId: string) {
  return db
    .select({
      inviterId: inviteMembers.inviterId,
      total: count(),
      active: count(sql`case when ${inviteMembers.leftAt} is null then 1 end`),
    })
    .from(inviteMembers)
    .where(
      and(
        eq(inviteMembers.guildId, guildId),
        isNotNull(inviteMembers.inviterId),
      ),
    )
    .groupBy(inviteMembers.inviterId)
    .orderBy(desc(count()))
    .limit(10);
}

export function recentInvites(guildId: string) {
  return db
    .select()
    .from(inviteMembers)
    .where(eq(inviteMembers.guildId, guildId))
    .orderBy(desc(inviteMembers.joinedAt))
    .limit(15);
}

export function resetInvites(guildId: string, inviterId?: string) {
  return db
    .delete(inviteMembers)
    .where(
      inviterId
        ? and(
            eq(inviteMembers.guildId, guildId),
            eq(inviteMembers.inviterId, inviterId),
          )
        : eq(inviteMembers.guildId, guildId),
    );
}
