import { ChannelType, PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { evt } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { voiceChannels } from "../../db/schema.ts";
import { voiceMasterSettings } from "../../features/settings/voicemaster.ts";

export default evt({
  name: "voiceStateUpdate",
  run: async (before, after) => {
    const guild = after.guild;
    const settings = await voiceMasterSettings(guild.id);
    if (
      settings.enabled &&
      after.channelId === settings.joinChannelId &&
      after.member
    ) {
      const created = await guild.channels.create({
        name: (settings.defaultName ?? "{user}'s channel").replace(
          "{user}",
          after.member.displayName,
        ),
        type: ChannelType.GuildVoice,
        parent: settings.categoryId,
        userLimit: settings.defaultLimit ?? 0,
        permissionOverwrites: [
          {
            id: after.member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });
      await db.insert(voiceChannels).values({
        channelId: created.id,
        guildId: guild.id,
        ownerId: after.member.id,
      });
      await after
        .setChannel(created)
        .catch(() => created.delete().catch(() => undefined));
    }
    if (before.channel && before.channel.members.size === 0) {
      const channel = before.channel;
      const channelId = channel.id;
      const [owned] = await db
        .select()
        .from(voiceChannels)
        .where(eq(voiceChannels.channelId, channelId))
        .limit(1);
      if (owned) {
        await channel
          .delete("Empty VoiceMaster channel")
          .catch(() => undefined);
        await db
          .delete(voiceChannels)
          .where(eq(voiceChannels.channelId, channelId));
      }
    }
  },
});
