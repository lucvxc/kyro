import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "strip", description: "Remove every manageable role from a member.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles], syntax: "strip <user> (reason)", example: "strip @user Staff removal",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    const roles = await ctx.mod.strip(user, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Removed **${roles.length}** role${roles.length === 1 ? "" : "s"} from **${user.tag}**.`));
  },
});
