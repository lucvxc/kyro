import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "clean links",
  description: "Delete recent messages containing links.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "clean links (amount)",
  example: "clean links 50",
  args: { amount: { type: "number", default: 100 } },
  run: async (ctx) => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const count = await ctx.server.channels.clean(
      channel,
      "links",
      ctx.number("amount")!,
    );
    return ctx.reply(
      embeds.success(
        `Deleted **${count}** link message${count === 1 ? "" : "s"}.`,
      ),
    );
  },
});
