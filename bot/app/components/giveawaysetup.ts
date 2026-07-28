import { PermissionFlagsBits } from "discord.js";
import { cmp, modal, UserError } from "../../../index.ts";
import { startGiveaway } from "../../features/giveaways/index.ts";
import { parseDelay } from "../../features/reminders/index.ts";
import embeds from "../../shared/config/embeds.ts";

export default cmp({
  id: /^giveaway_setup:\d{17,20}:\d{17,20}$/,
  context: "guild",
  run: async (ctx) => {
    const [, ownerId, originId] = ctx.id.split(":");
    if (ctx.user.id !== ownerId)
      throw new UserError("Only the person who opened this setup can use it.");
    const member = await ctx.guild!.members.fetch(ctx.user.id);
    if (!member.permissions.has(PermissionFlagsBits.ManageEvents))
      throw new UserError("You need Manage Events to start giveaways.");

    if (!ctx.interaction.isModalSubmit()) {
      return ctx.showModal(
        modal({
          id: ctx.id,
          title: "Start Giveaway",
          inputs: [
            {
              id: "prize",
              label: "Prize",
              placeholder: "Discord Nitro",
              max: 200,
            },
            {
              id: "duration",
              label: "Duration",
              description: "Use 30m, 2h, 1d, or similar.",
              placeholder: "1h",
              max: 12,
            },
            { id: "winners", label: "Winners", placeholder: "1", max: 2 },
            {
              type: "channel",
              id: "channel",
              label: "Channel",
              description: "Optional. Defaults to the original channel.",
              required: false,
              min: 0,
              max: 1,
            },
          ],
        }),
      );
    }

    const delay = parseDelay(ctx.field("duration") ?? "");
    if (!delay)
      throw new UserError("Use a duration like `30m`, `2h`, or `1d`.");
    const winners = Number(ctx.field("winners"));
    if (!Number.isInteger(winners) || winners < 1 || winners > 20)
      throw new UserError("Winner count must be between 1 and 20.");
    const prize = ctx.field("prize")?.trim();
    if (!prize) throw new UserError("Enter a giveaway prize.");

    const selected = ctx.channelIds("channel")[0];
    const channel = ctx.guild!.channels.cache.get(selected ?? originId!);
    if (!channel?.isTextBased() || !channel.isSendable() || channel.isDMBased())
      throw new UserError(
        "Choose a server text channel where I can send messages.",
      );
    const { id } = await startGiveaway(
      channel,
      ctx.user.id,
      prize,
      new Date(Date.now() + delay),
      winners,
    );
    return ctx.private(
      embeds.success(`Giveaway started in ${channel}. ID: **${id}**`),
    );
  },
});
