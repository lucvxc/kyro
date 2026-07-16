import { cmd, container, thumb, time } from "../../../index.ts";

export default cmd({
  name: "userinfo",
  description: "Show information about a user.",
  type: "hybrid",
  aliases: ["user", "ui", "whois"],
  syntax: "userinfo (@user)",
  example: "userinfo @lucvmf",
  args: {
    user: { type: "user", description: "The user to look up" },
  },
  run: async (ctx) => {
    const user = await ctx.userStats("user");
    const avatar = user.avatar();

    const card = container()
      .accent(await user.accent())
      .section(`## ${user.tag}\n${user.bot ? "Discord Bot" : "Discord User"}`, thumb(avatar))
      .separator()
      .text(`**Created** ${time(user.created)}${user.inServer ? `\n**Joined** ${time(user.joined!)}\n**Nickname** ${user.nickname ?? "None"}\n**Highest Role** ${user.highestRole}` : ""}`)
      .text(`-# ID ${user.id}`);

    return ctx.reply(card);
  },
});
