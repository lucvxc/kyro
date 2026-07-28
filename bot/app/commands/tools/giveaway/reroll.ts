import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { findGiveaway, pick } from "../../../../features/giveaways/index.ts";

export default cmd({
  name: "giveaway reroll",
  aliases: ["gw reroll", "gaw reroll"],
  description: "Pick new giveaway winners.",
  syntax: "giveaway reroll (message ID or giveaway ID)",
  example: "giveaway reroll 1531403703758618806",
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
    const item = await findGiveaway(ref, ctx.guild!.id);
    if (!item) throw new UserError("Giveaway not found.");
    if (!item.endedAt) throw new UserError("That giveaway has not ended yet.");
    const winners = pick(item.entries, item.winnerCount);
    return ctx.reply(
      winners.length
        ? `🎉 New winner${winners.length === 1 ? "" : "s"}: ${winners.map((id) => `<@${id}>`).join(", ")}`
        : "There are no entries to reroll.",
    );
  },
});
