import { PermissionFlagsBits } from "discord.js";
import { button, cmd, container, UserError } from "../../../../../index.ts";
import { startGiveaway } from "../../../../features/giveaways/index.ts";
import { parseDelay } from "../../../../features/reminders/index.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "giveaway start",
  aliases: ["gw start", "gaw start"],
  description: "Start a giveaway.",
  syntax: "giveaway start <duration> <winners> <prize>",
  example: "giveaway start 1h 2 Nitro",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageEvents],
  args: {
    duration: { type: "string" },
    winners: { type: "number" },
    prize: { type: "string" },
  },
  run: async (ctx) => {
    const duration = ctx.string("duration");
    const winners = ctx.number("winners");
    const prize = ctx.string("prize");
    if (!duration && winners === null && !prize) {
      return ctx.reply(
        container()
          .accent(colors.default)
          .text(
            "Create a giveaway in this channel or choose another channel in the popup.",
          )
          .row(
            button({
              id: `giveaway_setup:${ctx.author.id}:${ctx.message!.channelId}`,
              label: "Start Giveaway",
              style: "secondary",
            }),
          ),
      );
    }
    if (!duration || winners === null || !prize)
      throw new UserError(
        "Use `gw start <duration> <winners> <prize>`, or run `gw start` by itself.",
      );
    const delay = parseDelay(duration);
    if (!delay)
      throw new UserError("Use a duration like `30m`, `2h`, or `1d`.");
    if (
      !ctx.message!.channel.isSendable() ||
      !ctx.message!.channel.isTextBased() ||
      ctx.message!.channel.isDMBased()
    )
      throw new UserError("Start giveaways in a server text channel.");
    if (winners < 1 || winners > 20)
      throw new UserError("Winner count must be between 1 and 20.");
    const { id } = await startGiveaway(
      ctx.message!.channel,
      ctx.author.id,
      prize.slice(0, 200),
      new Date(Date.now() + delay),
      winners,
    );
    return ctx.reply(embeds.success(`Giveaway started. ID: **${id}**`));
  },
});
