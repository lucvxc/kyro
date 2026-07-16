import { cmd, container, thumb, time, UserError } from "../../../index.ts";

export default cmd({
  name: "joinedat",
  description: "Show when a member joined this server.",
  type: "message",
  aliases: ["joined"],
  syntax: "joinedat (@user)",
  example: "joinedat @lucvmf",
  context: "guild",
  args: { user: { type: "user", description: "The member to look up" } },
  run: async (ctx) => {
    const user = await ctx.userStats("user", true);
    if (!user.joined) throw new UserError("That user is not a member of this server.");

    return ctx.reply(container()
      .accent(await user.accent())
      .section(`## ${user.tag}\n-# Server join date`, thumb(user.avatar()))
      .separator()
      .text(`**Joined** ${time(user.joined)}\n**Member for** ${time(user.joined, "R")}`));
  },
});
