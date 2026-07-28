import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import { antiRaidPanel } from "../../../../features/security/panels.ts";
import { securitySettings } from "../../../../features/settings/security.ts";

export default cmd({
  name: "antiraid config",
  aliases: ["raid config"],
  description: "Open the interactive AntiRaid configuration panel.",
  syntax: "antiraid config",
  example: "antiraid config",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const config = (await securitySettings(ctx.guild!.id)).antiraid;
    requireSecurityAccess(ctx.guild!, ctx.author.id, config.admins);
    return ctx.reply(antiRaidPanel(config, ctx.author.id));
  },
});
