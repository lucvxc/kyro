import { cmd } from "../../../../../index.ts";
import {
  listWith,
  requireOwner,
} from "../../../../features/security/access.ts";
import { updateSecurity } from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke admin",
  aliases: ["an admin"],
  description: "Allow a user to configure AntiNuke.",
  syntax: "antinuke admin <user>",
  example: "antinuke admin @user",
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
        admins: listWith(value.antinuke.admins, user.id),
      },
    }));
    return ctx.reply(
      embeds.success(`Added **${user.tag}** as an AntiNuke admin.`),
    );
  },
});
