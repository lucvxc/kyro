import type { Client, Guild, GuildMember, Invite } from "discord.js";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/database.ts";
import { inviteMembers } from "../../db/schema.ts";

type Uses = Map<string, number>;
const cache = new Map<string, Uses>();
const locks = new Map<string, Promise<void>>();

export async function startInvites(client: Client) {
  for (const guild of client.guilds.cache.values()) await refresh(guild);
}

export async function refresh(guild: Guild) {
  const invites = await guild.invites.fetch().catch(() => null);
  if (invites)
    cache.set(
      guild.id,
      new Map(invites.map((invite) => [invite.code, invite.uses ?? 0])),
    );
}

export function cacheInvite(invite: Invite) {
  const current = cache.get(invite.guild!.id) ?? new Map();
  current.set(invite.code, invite.uses ?? 0);
  cache.set(invite.guild!.id, current);
}

export function removeInvite(invite: Invite) {
  cache.get(invite.guild!.id)?.delete(invite.code);
}

export function trackJoin(member: GuildMember) {
  queue(member.guild.id, () => join(member));
}

export async function trackLeave(member: Pick<GuildMember, "guild" | "id">) {
  const [row] = await db
    .select({ id: inviteMembers.id })
    .from(inviteMembers)
    .where(
      and(
        eq(inviteMembers.guildId, member.guild.id),
        eq(inviteMembers.memberId, member.id),
        isNull(inviteMembers.leftAt),
      ),
    )
    .orderBy(desc(inviteMembers.joinedAt))
    .limit(1);
  if (row)
    await db
      .update(inviteMembers)
      .set({ leftAt: new Date() })
      .where(eq(inviteMembers.id, row.id));
}

async function join(member: GuildMember) {
  const before = cache.get(member.guild.id) ?? new Map();
  const invites = await member.guild.invites.fetch().catch(() => null);
  const used = invites?.find(
    (invite) => (invite.uses ?? 0) > (before.get(invite.code) ?? 0),
  );
  if (invites)
    cache.set(
      member.guild.id,
      new Map(invites.map((invite) => [invite.code, invite.uses ?? 0])),
    );
  const fake = Date.now() - member.user.createdTimestamp < 7 * 86_400_000;
  await db.insert(inviteMembers).values({
    guildId: member.guild.id,
    memberId: member.id,
    inviterId: used?.inviterId ?? null,
    code: used?.code ?? null,
    fake,
  });
}

function queue(guildId: string, run: () => Promise<void>) {
  const next = (locks.get(guildId) ?? Promise.resolve())
    .then(run)
    .catch(() => undefined)
    .finally(() => {
      if (locks.get(guildId) === next) locks.delete(guildId);
    });
  locks.set(guildId, next);
}
