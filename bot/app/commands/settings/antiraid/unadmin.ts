import { cmd } from "../../../../../index.ts";
import {
  listWithout,
  requireOwner,
} from "../../../../features/security/access.ts";
import { updateSecurity } from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antiraid unadmin",
  aliases: ["raid unadmin"],
  description: "Remove an AntiRaid admin.",
  syntax: "antiraid unadmin <user>",
  example: "antiraid unadmin @user",
  type: "message",
  context: "guild",
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    requireOwner(ctx.guild!, ctx.author.id);
    const user = ctx.user("user")!;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antiraid: {
        ...value.antiraid,
        admins: listWithout(value.antiraid.admins, user.id),
      },
    }));
    return ctx.reply(
      embeds.success(`Removed **${user.tag}** as an AntiRaid admin.`),
    );
  },
});
