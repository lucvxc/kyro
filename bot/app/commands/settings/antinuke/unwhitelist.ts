import { cmd } from "../../../../../index.ts";
import {
  listWithout,
  requireSecurityAccess,
} from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke unwhitelist",
  aliases: ["an unwhitelist"],
  description: "Remove a user from the AntiNuke whitelist.",
  syntax: "antinuke unwhitelist <user>",
  example: "antinuke unwhitelist @user",
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
        whitelist: listWithout(value.antinuke.whitelist, user.id),
      },
    }));
    return ctx.reply(
      embeds.success(`Removed **${user.tag}** from the AntiNuke whitelist.`),
    );
  },
});
