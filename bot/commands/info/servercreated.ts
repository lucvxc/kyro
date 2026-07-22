import { cmd, container, time } from "../../../index.ts";

export default cmd({
  name: "servercreated",
  description: "Show when this server was created.",
  type: "message",
  aliases: ["serverage"],
  syntax: "servercreated",
  example: "servercreated",
  context: "guild",
  run: async (ctx) =>
    ctx.reply(
      container()
        .accent(await ctx.guild!.stats.accent())
        .text(`## ${ctx.guild!.stats.name}`)
        .separator()
        .text(
          `**Created** ${time(ctx.guild!.stats.created)}\n**Age** ${time(ctx.guild!.stats.created, "R")}\n-# ID ${ctx.guild!.stats.id}`,
        ),
    ),
});
