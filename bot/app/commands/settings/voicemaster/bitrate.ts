import { cmd, UserError } from "../../../../../index.ts";
import { ownedVoiceChannel } from "../../../../features/voicemaster/channel.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "voicemaster bitrate",
  aliases: ["vm bitrate"],
  description: "Set your VoiceMaster channel bitrate.",
  syntax: "voicemaster bitrate <bitrate>",
  example: "voicemaster bitrate 5",
  type: "message",
  context: "guild",
  args: {
    bitrate: { type: "number", required: true, description: "Bitrate in kbps" },
  },
  run: async (ctx) => {
    const bitrate = ctx.number("bitrate")!;
    const maximum = Math.floor(ctx.guild!.maximumBitrate / 1_000);
    if (!Number.isInteger(bitrate) || bitrate < 8 || bitrate > maximum)
      throw new UserError(`Bitrate must be from 8 to ${maximum}kbps.`);
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.setBitrate(bitrate * 1_000);
    return ctx.reply(
      embeds.success(`Channel bitrate set to **${bitrate}kbps**.`),
    );
  },
});
