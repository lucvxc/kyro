import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  lockGuild,
  unlockGuild,
} from "../../../../features/security/lockdown.ts";
import { securitySettings } from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antiraid lockdown",
  aliases: ["raid lockdown"],
  description: "Toggle the server-wide AntiRaid lockdown.",
  syntax: "antiraid lockdown",
  example: "antiraid lockdown",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antiraid;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const count = current.lockdown.active
      ? await unlockGuild(ctx.guild!)
      : await lockGuild(ctx.guild!);
    return ctx.reply(
      embeds.success(
        `${current.lockdown.active ? "Unlocked" : "Locked"} **${count}** channels.`,
      ),
    );
  },
});
