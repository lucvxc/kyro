import { cmd } from "../../../../index.ts";
import { ownedVoiceChannel } from "../../../services/voicemaster.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "voicemaster rename",
  aliases: ["vm rename"],
  description: "Rename your temporary voice channel.",
  type: "message",
  context: "guild",
  args: {
    name: { type: "string", required: true, description: "New channel name" },
  },
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.author.id);
    const channel = await ownedVoiceChannel(member);
    await channel.setName(
      ctx.string("name")!.slice(0, 100),
      "VoiceMaster owner renamed channel",
    );
    return ctx.reply(
      embeds.success(`Renamed your channel to **${channel.name}**.`),
    );
  },
});
