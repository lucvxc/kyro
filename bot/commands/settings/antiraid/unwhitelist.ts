import { cmd } from "../../../../index.ts";
import {
  listWithout,
  requireSecurityAccess,
} from "../../../services/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../services/settings/security.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antiraid unwhitelist",
  description: "Remove a user from the AntiRaid whitelist.",
  syntax: "antiraid unwhitelist <user>",
  example: "antiraid unwhitelist @user",
  type: "message",
  context: "guild",
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antiraid;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const user = ctx.user("user")!;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antiraid: {
        ...value.antiraid,
        whitelist: listWithout(value.antiraid.whitelist, user.id),
      },
    }));
    return ctx.reply(
      embeds.success(`Removed **${user.tag}** from the AntiRaid whitelist.`),
    );
  },
});
