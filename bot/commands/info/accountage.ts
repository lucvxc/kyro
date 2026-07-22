import { cmd, container, thumb, time } from "../../../index.ts";

export default cmd({
  name: "accountage",
  description: "Show when a Discord account was created.",
  type: "hybrid",
  aliases: ["created"],
  syntax: "accountage (@user)",
  example: "accountage @lucvmf",
  args: { user: { type: "user", description: "The user to look up" } },
  run: async (ctx) => {
    const user = await ctx.userStats("user");
    return ctx.reply(
      container()
        .accent(await user.accent())
        .section(`## ${user.tag}\n-# Account creation`, thumb(user.avatar()))
        .separator()
        .text(
          `**Created** ${time(user.created)}\n**Age** ${time(user.created, "R")}\n-# ID ${user.id}`,
        ),
    );
  },
});
