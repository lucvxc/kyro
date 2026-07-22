import { cmd, UserError } from "../../../../index.ts";
import { ownedVoiceChannel } from "../../../services/voicemaster.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster reject",
  aliases: ["vm reject"],
  description: "Block and disconnect a member from your VoiceMaster channel.",
  type: "message",
  context: "guild",
  args: {
    user: { type: "user", required: true, description: "Member to reject" },
  },
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.user("user")!.id);
    if (member.id === ctx.author.id)
      throw new UserError("You cannot reject yourself.");
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    if (channel.members.has(member.id))
      await member.voice.disconnect("Rejected by VoiceMaster owner");
    await channel.permissionOverwrites.edit(member.id, {
      ViewChannel: false,
      Connect: false,
    });
    return ctx.reply(embeds.success(`Rejected **${member.user.tag}**.`));
  },
});
