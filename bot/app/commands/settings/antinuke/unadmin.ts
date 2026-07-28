import { cmd } from "../../../../../index.ts";
import {
  listWithout,
  requireOwner,
} from "../../../../features/security/access.ts";
import { updateSecurity } from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke unadmin",
  aliases: ["an unadmin"],
  description: "Remove an AntiNuke admin.",
  syntax: "antinuke unadmin <user>",
  example: "antinuke unadmin @user",
  type: "message",
  context: "guild",
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    requireOwner(ctx.guild!, ctx.author.id);
    const user = ctx.user("user")!;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: {
        ...value.antinuke,
        admins: listWithout(value.antinuke.admins, user.id),
      },
    }));
    return ctx.reply(
      embeds.success(`Removed **${user.tag}** as an AntiNuke admin.`),
    );
  },
});
