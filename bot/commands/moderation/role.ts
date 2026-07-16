import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "role",
  aliases: ["togglerole", "tr"],
  description: "Add or remove a role from a member.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  syntax: "role <user> <role> (reason)",
  example: "role @user Moderator",
  args: {
    user: { type: "user", required: true },
    role: { type: "role", required: true },
    reason: { type: "string" },
  },
  run: async ctx => {
    const user = ctx.user("user")!;
    const role = ctx.role("role")!;
    const add = await ctx.mod.toggleRole(user, role, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`${add ? "Gave" : "Removed"} ${role} ${add ? "to" : "from"} **${user.tag}**.`));
  },
});
