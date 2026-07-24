import { cmd } from "../../../../index.ts";
import { requireSecurityAccess } from "../../../services/security/access.ts";
import { antiNukePanel } from "../../../services/security/panels.ts";
import { securitySettings } from "../../../services/settings/security.ts";

export default cmd({
  name: "antinuke config",
  aliases: ["antinuke cfg"],
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
