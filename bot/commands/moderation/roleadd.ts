import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "addrole", aliases: ["roleadd", "ar"], description: "Give a role to a member.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles], syntax: "addrole <user> <role> (reason)", example: "addrole @user Moderator",
  args: { user: { type: "user", required: true }, role: { type: "role", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    const role = ctx.role("role")!;
    await ctx.mod.role(user, role, true, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Gave ${role} to **${user.tag}**.`));
  },
});
