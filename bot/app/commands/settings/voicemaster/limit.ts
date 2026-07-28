import { cmd, UserError } from "../../../../../index.ts";
import { ownedVoiceChannel } from "../../../../features/voicemaster/channel.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "voicemaster limit",
  aliases: ["vm limit"],
  description: "Set your temporary channel's user limit.",
  syntax: "voicemaster limit <limit>",
  example: "voicemaster limit 5",
  type: "message",
  context: "guild",
  args: {
    limit: { type: "number", required: true, description: "0 to 99 users" },
  },
  run: async (ctx) => {
    const limit = ctx.number("limit")!;
    if (!Number.isInteger(limit) || limit < 0 || limit > 99)
      throw new UserError("The limit must be from 0 to 99.");
    const channel = await ownedVoiceChannel(
      await ctx.guild!.members.fetch(ctx.author.id),
    );
    await channel.setUserLimit(limit, "VoiceMaster owner changed limit");
    return ctx.reply(
      embeds.success(
        limit ? `Channel limit set to **${limit}**.` : "Channel limit removed.",
      ),
    );
  },
});
