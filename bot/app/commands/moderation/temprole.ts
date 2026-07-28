import { PermissionFlagsBits } from "discord.js";
import { cmd, duration, UserError } from "../../../../index.ts";
import { addTempRole } from "../../../features/roles/temporary.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "temprole",
  description: "Give a member a role temporarily.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  syntax: "temprole <user> <role> <duration> (reason)",
  example: "temprole @user Subscriber 7d",
  args: {
    user: { type: "user", required: true },
    role: { type: "role", required: true },
    duration: { type: "string", required: true },
    reason: { type: "string" },
  },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    const role = ctx.role("role")!;
    const input = ctx.string("duration")!;
    const length = duration(input);
    if (length < 1_000)
      throw new UserError("Use a valid duration such as `30m`, `2h`, or `7d`.");
    const member = await ctx.server.members.get(user);
    if (!member.roles.cache.has(role.id))
      await ctx.mod.role(user, role, true, {
        reason: ctx.string("reason") ?? undefined,
      });
    await addTempRole(
      ctx.client,
      ctx.guild!.id,
      user.id,
      role.id,
      new Date(Date.now() + length),
    );
    return ctx.reply(
      embeds.success(`Gave ${role} to **${user.tag}** for **${input}**.`),
    );
  },
});
