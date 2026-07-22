import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { voiceMasterChannel } from "../../../services/voicemaster.ts";
import { colors } from "../../../utils/config/config.ts";

export default cmd({
  name: "voicemaster info",
  aliases: ["vm info"],
  description: "View information about your VoiceMaster channel.",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const { channel, record } = await voiceMasterChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    const everyone = channel.permissionOverwrites.cache.get(
      ctx.guild!.roles.everyone.id,
    );
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## ${channel.name}\n-# Owner <@${record.ownerId}> · ${channel.members.size} members\n**Limit** ${channel.userLimit || "None"} · **Bitrate** ${channel.bitrate / 1_000}kbps\n**Locked** ${everyone?.deny.has(PermissionFlagsBits.Connect) ? "Yes" : "No"} · **Hidden** ${everyone?.deny.has(PermissionFlagsBits.ViewChannel) ? "Yes" : "No"}`,
        ),
    );
  },
});
