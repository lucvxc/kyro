import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
} from "discord.js";
import { and, eq } from "drizzle-orm";
import { UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { tickets } from "../../db/schema.ts";
import { editTicketSettings, getTicketSettings } from "../settings/tickets.ts";
import { ticketControls } from "./panel.ts";
import { logTicket } from "./log.ts";
import { transcript } from "./transcript.ts";

export async function openTicket(guild: Guild, member: GuildMember) {
  const settings = await getTicketSettings(guild.id);
  if (!settings.enabled || !settings.categoryId)
    throw new UserError("Tickets are not enabled in this server.");
  const [open] = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.guildId, guild.id),
        eq(tickets.userId, member.id),
        eq(tickets.status, "open"),
      ),
    )
    .limit(1);
  if (open)
    throw new UserError(
      `You already have an open ticket: <#${open.channelId}>`,
    );

  const number = (settings.counter ?? 0) + 1;
  const staff = (settings.staffRoleIds ?? []).map((id) => ({
    id,
    allow: staffPerms,
  }));
  const channel = await guild.channels.create({
    name: `ticket-${number.toString().padStart(4, "0")}`,
    type: ChannelType.GuildText,
    parent: settings.categoryId,
    topic: `Ticket ${number} · ${member.user.tag} · ${member.id}`,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: userPerms },
      { id: guild.client.user.id, allow: staffPerms },
      ...staff,
    ],
    reason: `Ticket opened by ${member.user.tag}`,
  });
  const [record] = await db
    .insert(tickets)
    .values({
      guildId: guild.id,
      channelId: channel.id,
      userId: member.id,
      number,
    })
    .returning();
  await editTicketSettings(guild.id, (value) => ({
    ...value,
    counter: number,
  }));
  await channel.send({
    content: `${member}`,
    allowedMentions: { users: [member.id] },
    ...ticketControls(record!.id),
  });
  await logTicket(guild, record!, "opened", member.id);
  return channel;
}

export async function ticketFor(channelId: string) {
  const [record] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.channelId, channelId))
    .limit(1);
  if (!record) throw new UserError("This is not a ticket channel.");
  return record;
}

export async function closeTicket(
  guild: Guild,
  channelId: string,
  userId: string,
) {
  const record = await ticketFor(channelId);
  if (record.status === "closed")
    throw new UserError("This ticket is already closed.");
  await db
    .update(tickets)
    .set({ status: "closed", closedBy: userId, closedAt: new Date() })
    .where(eq(tickets.id, record.id));
  const channel = guild.channels.cache.get(channelId);
  const file =
    channel?.type === ChannelType.GuildText
      ? await transcript(channel).catch(() => undefined)
      : undefined;
  await logTicket(
    guild,
    { ...record, status: "closed", closedBy: userId, closedAt: new Date() },
    "closed",
    userId,
    file,
  );
  return record;
}

export async function claimTicket(
  guild: Guild,
  channelId: string,
  userId: string,
) {
  const record = await ticketFor(channelId);
  if (record.status !== "open") throw new UserError("This ticket is closed.");
  if (record.claimedBy && record.claimedBy !== userId)
    throw new UserError(
      `This ticket is already claimed by <@${record.claimedBy}>.`,
    );
  const claimedBy = record.claimedBy === userId ? null : userId;
  await db.update(tickets).set({ claimedBy }).where(eq(tickets.id, record.id));
  const next = { ...record, claimedBy };
  await logTicket(guild, next, claimedBy ? "claimed" : "unclaimed", userId);
  return next;
}

export async function reopenTicket(
  guild: Guild,
  channelId: string,
  userId: string,
) {
  const record = await ticketFor(channelId);
  if (record.status === "open")
    throw new UserError("This ticket is already open.");
  await db
    .update(tickets)
    .set({ status: "open", closedBy: null, closedAt: null })
    .where(eq(tickets.id, record.id));
  const next = { ...record, status: "open", closedBy: null, closedAt: null };
  await logTicket(guild, next, "reopened", userId);
  return next;
}

const userPerms = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
];
const staffPerms = [
  ...userPerms,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageChannels,
];
