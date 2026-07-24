import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateFilters } from "../../../services/settings/filters.ts";
import embeds from "../../../utils/config/embeds.ts";

const punishments = ["delete", "warn", "timeout", "kick", "ban"] as const;

export default cmd({
  name: "antilink punishment",
  description: "Set what happens when someone posts a link.",
  syntax: "antilink punishment <punishment>",
  example: "antilink punishment punishment",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    punishment: {
      type: "string",
      required: true,
      description: "delete, warn, timeout, kick, or ban",
    },
  },
  run: async (ctx) => {
    const punishment = ctx.string("punishment")!.toLowerCase();
    if (!punishments.includes(punishment as (typeof punishments)[number]))
      throw new UserError("Use delete, warn, timeout, kick, or ban.");
    await updateFilters(ctx.guild!.id, (value) => ({
      ...value,
      antilink: {
        ...value.antilink,
        punishment: punishment as (typeof punishments)[number],
      },
    }));
    return ctx.reply(
      embeds.success(`Anti-link punishment set to **${punishment}**.`),
    );
  },
});
