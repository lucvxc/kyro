import {
  button,
  cmd,
  container,
  dominant,
  thumb,
  time,
} from "../../../index.ts";

export default cmd({
  name: "botinfo",
  description: "Show information about the bot.",
  type: "hybrid",
  aliases: ["bi"],
  syntax: "botinfo",
  example: "botinfo",
  run: async (ctx) => {
    const card = container()
      .accent(await dominant(ctx.stats.avatar()))
      .section(
        `## ${ctx.stats.name}\nOnline since ${time(ctx.stats.since, "R")}`,
        thumb(ctx.stats.avatar()),
      )
      .separator()
      .text(
        `**${ctx.stats.servers.toLocaleString()}** Servers · **${ctx.stats.users.toLocaleString()}** Users · **${ctx.stats.ping}ms** Ping`,
      )
      .text(
        `**Library** discord.js v14\n**Language** TypeScript\n**Lines** ${(await ctx.stats.lines()).toLocaleString()}`,
      )
      .text(`-# Bun ${Bun.version} · ${ctx.stats.memory} MB RAM`)
      .row(
        button({
          label: "Invite",
          style: "link",
          url: `https://discord.com/oauth2/authorize?client_id=${ctx.stats.id}&scope=bot%20applications.commands`,
        }),
      );

    return ctx.reply(card);
  },
});
