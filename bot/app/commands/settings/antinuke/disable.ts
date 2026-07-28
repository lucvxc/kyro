import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke disable",
  aliases: ["an disable"],
  description: "Disable AntiNuke protection.",
  syntax: "antinuke disable",
  example: "antinuke disable",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    if (!current.enabled)
      return ctx.reply(embeds.warning("AntiNuke is already disabled."));
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: { ...value.antinuke, enabled: false },
    }));
    return ctx.reply(embeds.success("AntiNuke disabled."));
  },
});
