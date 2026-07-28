import { cmd } from "../../../../../index.ts";
import { ownedVoiceChannel } from "../../../../features/voicemaster/channel.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "voicemaster unlock",
  aliases: ["vm unlock"],
  description: "Allow members to join your channel again.",
  syntax: "voicemaster unlock",
  example: "voicemaster unlock",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.permissionOverwrites.edit(ctx.guild!.roles.everyone, {
      Connect: null,
    });
    return ctx.reply(embeds.success("Your voice channel is unlocked."));
  },
});
