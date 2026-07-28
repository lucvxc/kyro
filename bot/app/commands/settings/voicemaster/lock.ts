import { cmd } from "../../../../../index.ts";
import { ownedVoiceChannel } from "../../../../features/voicemaster/channel.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "voicemaster lock",
  aliases: ["vm lock"],
  description: "Stop new members from joining your channel.",
  syntax: "voicemaster lock",
  example: "voicemaster lock",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.permissionOverwrites.edit(ctx.guild!.roles.everyone, {
      Connect: false,
    });
    return ctx.reply(embeds.success("Your voice channel is locked."));
  },
});
