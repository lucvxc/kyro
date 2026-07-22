import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "clean images",
  description: "Delete recent messages containing images.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "clean images (amount)",
  example: "clean images 50",
  args: { amount: { type: "number", default: 100 } },
  run: async (ctx) => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const count = await ctx.server.channels.clean(
      channel,
      "images",
      ctx.number("amount")!,
    );
    return ctx.reply(
      embeds.success(
        `Deleted **${count}** image message${count === 1 ? "" : "s"}.`,
      ),
    );
  },
});
