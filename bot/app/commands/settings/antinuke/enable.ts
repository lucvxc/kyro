import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke enable",
  aliases: ["an enable"],
  description: "Enable AntiNuke protection.",
  syntax: "antinuke enable",
  example: "antinuke enable",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    if (current.enabled)
      return ctx.reply(embeds.warning("AntiNuke is already enabled."));
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: { ...value.antinuke, enabled: true },
    }));
    return ctx.reply(embeds.success("AntiNuke enabled."));
  },
});
