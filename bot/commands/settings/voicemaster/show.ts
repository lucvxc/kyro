import { cmd } from "../../../../index.ts";
import { ownedVoiceChannel } from "../../../services/voicemaster/channel.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster unhide",
  aliases: ["vm unhide", "voicemaster show", "vm show"],
  description: "Make your temporary channel visible again.",
  syntax: "voicemaster unhide",
  example: "voicemaster unhide",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.permissionOverwrites.edit(ctx.guild!.roles.everyone, {
      ViewChannel: null,
    });
    return ctx.reply(embeds.success("Your voice channel is visible."));
  },
});
