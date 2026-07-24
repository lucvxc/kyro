import { cmd } from "../../../../index.ts";
import { ownedVoiceChannel } from "../../../services/voicemaster/channel.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster hide",
  aliases: ["vm hide"],
  description: "Hide your temporary channel from everyone else.",
  syntax: "voicemaster hide",
  example: "voicemaster hide",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.permissionOverwrites.edit(ctx.guild!.roles.everyone, {
      ViewChannel: false,
    });
    return ctx.reply(embeds.success("Your voice channel is hidden."));
  },
});
