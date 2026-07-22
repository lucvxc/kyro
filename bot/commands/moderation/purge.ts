import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "purge",
  aliases: ["clear"],
  description: "Bulk delete recent messages.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "purge <amount> (user)",
  example: "purge 25 @user",
  args: { amount: { type: "number", required: true }, user: { type: "user" } },
  run: async (ctx) => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const deleted = await ctx.server.channels.purge(
      channel,
      ctx.number("amount")!,
      ctx.user("user")?.id,
    );
    return ctx.reply(
      embeds.success(
        `Deleted **${deleted}** message${deleted === 1 ? "" : "s"}.`,
      ),
    );
  },
});
