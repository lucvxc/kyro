import { cmd } from "../../../../index.ts";
import { requireSecurityAccess } from "../../../services/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../services/settings/security.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antiraid disable",
  description: "Disable AntiRaid protection.",
  syntax: "antiraid disable",
  example: "antiraid disable",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antiraid;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    if (!current.enabled)
      return ctx.reply(embeds.warning("AntiRaid is already disabled."));
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antiraid: { ...value.antiraid, enabled: false },
    }));
    return ctx.reply(embeds.success("AntiRaid disabled."));
  },
});
