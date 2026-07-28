import { cmd, UserError } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import type { AntiNukeProtectionName } from "../../../../db/settings.ts";
import embeds from "../../../../shared/config/embeds.ts";

const protections = [
  "channelcreate",
  "channeldelete",
  "rolecreate",
  "roledelete",
  "ban",
  "kick",
  "webhook",
  "botadd",
  "administrator",
  "prune",
] as const;
export default cmd({
  name: "antinuke toggle",
  aliases: ["an toggle"],
  description: "Toggle one AntiNuke protection.",
  syntax: "antinuke toggle <protection>",
  example: "antinuke toggle protection",
  type: "message",
  context: "guild",
  args: { protection: { type: "string", required: true } },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const name = ctx
      .string("protection")
      ?.toLowerCase() as AntiNukeProtectionName;
    if (!protections.includes(name))
      throw new UserError(`Choose one of: ${protections.join(", ")}.`);
    const enabled = !current.protections[name].enabled;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: {
        ...value.antinuke,
        protections: {
          ...value.antinuke.protections,
          [name]: { ...value.antinuke.protections[name], enabled },
        },
      },
    }));
    return ctx.reply(
      embeds.success(
        `**${name}** protection ${enabled ? "enabled" : "disabled"}.`,
      ),
    );
  },
});
