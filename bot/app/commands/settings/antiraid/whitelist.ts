import { cmd } from "../../../../../index.ts";
import {
  listWith,
  requireSecurityAccess,
} from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antiraid whitelist",
  aliases: ["raid whitelist"],
  description: "Trust a user in AntiRaid.",
  syntax: "antiraid whitelist <user>",
  example: "antiraid whitelist @user",
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
        whitelist: listWith(value.antiraid.whitelist, user.id),
      },
    }));
    return ctx.reply(embeds.success(`AntiRaid now trusts **${user.tag}**.`));
  },
});
