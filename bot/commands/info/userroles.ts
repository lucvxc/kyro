import { cmd, container, thumb, UserError } from "../../../index.ts";

export default cmd({
  name: "userroles",
  description: "Show a member's roles.",
  type: "message",
  aliases: ["rolesof"],
  syntax: "userroles (@user)",
  example: "userroles @lucvmf",
  context: "guild",
  args: { user: { type: "user", description: "The member to look up" } },
  run: async (ctx) => {
    const user = await ctx.userStats("user");
    if (!user.inServer) throw new UserError("That user is not a member of this server.");

    const roles = user.roles();
    return ctx.reply(container()
      .accent(await user.accent())
      .section(`## ${user.tag}'s Roles\n-# ${roles.length} ${roles.length === 1 ? "role" : "roles"}`, thumb(user.avatar()))
      .separator()
      .text(roles.join(" · ") || "No roles."));
  },
});
