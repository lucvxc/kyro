import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { finish } from "../../../../features/giveaways/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "giveaway end",
  aliases: ["gw end", "gaw end"],
  description: "End a giveaway now.",
  syntax: "giveaway end (message ID or giveaway ID)",
  example: "giveaway end 1531403703758618806",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageEvents],
  args: { id: { type: "string" } },
  run: async (ctx) => {
    const ref = ctx.string("id") ?? ctx.message!.reference?.messageId;
    if (!ref)
      throw new UserError(
        "Provide the giveaway message ID, giveaway ID, or reply to the giveaway message.",
      );
    await finish(ctx.client, ref, ctx.guild!.id);
    return ctx.reply(embeds.success("Giveaway ended."));
  },
});
