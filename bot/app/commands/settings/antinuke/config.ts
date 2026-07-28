import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import { antiNukePanel } from "../../../../features/security/panels.ts";
import { securitySettings } from "../../../../features/settings/security.ts";

export default cmd({
  name: "antinuke config",
  aliases: ["an config"],
  description: "Open the interactive AntiNuke configuration panel.",
  syntax: "antinuke config",
  example: "antinuke config",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const config = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, config.admins);
    return ctx.reply(antiNukePanel(config, ctx.author.id));
  },
});
