import { cmd, UserError } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import type { AntiNukeSettings } from "../../../../db/settings.ts";
import embeds from "../../../../shared/config/embeds.ts";

const choices = ["ban", "kick", "timeout", "strip"] as const;
export default cmd({
  name: "antinuke punishment",
  aliases: ["an punishment"],
  description: "Choose what happens when AntiNuke triggers.",
  syntax: "antinuke punishment <punishment>",
  example: "antinuke punishment punishment",
  type: "message",
  context: "guild",
  args: { punishment: { type: "string", required: true } },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const punishment = ctx
      .string("punishment")
      ?.toLowerCase() as AntiNukeSettings["punishment"];
    if (!choices.includes(punishment))
      throw new UserError("Choose `ban`, `kick`, `timeout`, or `strip`.");
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: { ...value.antinuke, punishment },
    }));
    return ctx.reply(
      embeds.success(`AntiNuke punishment set to **${punishment}**.`),
    );
  },
});
