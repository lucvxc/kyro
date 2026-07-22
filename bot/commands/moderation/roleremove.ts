import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "removerole",
  aliases: ["roleremove", "rr"],
  description: "Remove a role from a member.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  syntax: "removerole <user> <role> (reason)",
  example: "removerole @user Moderator",
  args: {
    user: { type: "user", required: true },
    role: { type: "role", required: true },
    reason: { type: "string" },
  },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    const role = ctx.role("role")!;
    await ctx.mod.role(user, role, false, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(embeds.success(`Removed ${role} from **${user.tag}**.`));
  },
});
