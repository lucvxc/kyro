import { cmd, container, thumb, UserError } from "../../../../index.ts";

export default cmd({
  name: "permissions",
  description: "Show a member's server permissions.",
  type: "message",
  aliases: ["perms"],
  syntax: "permissions (@user)",
  example: "permissions @lucvmf",
  context: "guild",
  args: {
    user: { type: "user", description: "The member to look up" },
  },
  run: async (ctx) => {
    const user = await ctx.userStats("user");
    if (!user.inServer)
      throw new UserError("That user is not a member of this server.");

    const avatar = user.avatar();
    const card = container()
      .accent(await user.accent())
      .section(
        `## ${user.tag}'s Permissions\n${user.permissions.length} server permissions`,
        thumb(avatar),
      )
      .separator()
      .text(
        user.permissions.map((name) => `\`${name}\``).join(" · ") ||
          "No permissions",
      )
      .text(`-# ${user.mention}'s highest role is ${user.highestRole}`);

    return ctx.reply(card);
  },
});
