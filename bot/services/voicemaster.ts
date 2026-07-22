import type { GuildMember, VoiceChannel } from "discord.js";
import { eq } from "drizzle-orm";
import { UserError } from "../../index.ts";
import { db } from "../db/database.ts";
import { voiceChannels } from "../db/schema.ts";

export async function ownedVoiceChannel(
  member: GuildMember,
): Promise<VoiceChannel> {
  const { channel, record } = await voiceMasterChannel(member);
  const row = record;
  if (!row) throw new UserError("You do not own this VoiceMaster channel.");
  if (row.ownerId !== member.id)
    throw new UserError("You do not own this VoiceMaster channel.");
  return channel as VoiceChannel;
}

export async function voiceMasterChannel(member: GuildMember) {
  const channel = member.voice.channel;
  if (!channel) throw new UserError("Join your VoiceMaster channel first.");
  const [record] = await db
    .select()
    .from(voiceChannels)
    .where(eq(voiceChannels.channelId, channel.id))
    .limit(1);
  if (!record) throw new UserError("This is not a VoiceMaster channel.");
  return { channel: channel as VoiceChannel, record };
}
