import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "clean embeds",
  description: "Delete recent messages containing embeds.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "clean embeds (amount)",
  example: "clean embeds 50",
  args: { amount: { type: "number", default: 100 } },
  run: async (ctx) => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const count = await ctx.server.channels.clean(
      channel,
      "embeds",
      ctx.number("amount")!,
    );
    return ctx.reply(
      embeds.success(
        `Deleted **${count}** embed message${count === 1 ? "" : "s"}.`,
      ),
    );
  },
});
