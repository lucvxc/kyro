import { cmd } from "../../../../../index.ts";
import { ownedVoiceChannel } from "../../../../features/voicemaster/channel.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "voicemaster permit",
  aliases: ["vm permit"],
  description: "Allow a member into your VoiceMaster channel.",
  syntax: "voicemaster permit <user>",
  example: "voicemaster permit @user",
  type: "message",
  context: "guild",
  args: {
    user: { type: "user", required: true, description: "Member to permit" },
  },
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.user("user")!.id);
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      Connect: true,
    });
    return ctx.reply(embeds.success(`Permitted **${member.user.tag}**.`));
  },
});
