import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateFilters } from "../../../services/settings/filters.ts";
import embeds from "../../../utils/config/embeds.ts";

const punishments = ["delete", "warn", "timeout", "kick", "ban"] as const;

export default cmd({
  name: "antiinvite punishment",
  description: "Set what happens when someone posts a Discord invite.",
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
      antiinvite: {
        ...value.antiinvite,
        punishment: punishment as (typeof punishments)[number],
      },
    }));
    return ctx.reply(
      embeds.success(`Anti-invite punishment set to **${punishment}**.`),
    );
  },
});
