import { cmd } from "../../../../index.ts";
import {
  listWith,
  requireSecurityAccess,
} from "../../../services/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../services/settings/security.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antinuke whitelist",
  description: "Trust a user in AntiNuke.",
  syntax: "antinuke whitelist <user>",
  example: "antinuke whitelist @user",
  type: "message",
  context: "guild",
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const user = ctx.user("user")!;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: {
        ...value.antinuke,
        whitelist: listWith(value.antinuke.whitelist, user.id),
      },
    }));
    return ctx.reply(embeds.success(`AntiNuke now trusts **${user.tag}**.`));
  },
});
