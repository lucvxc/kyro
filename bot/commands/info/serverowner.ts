import { cmd, container, thumb } from "../../../index.ts";

export default cmd({
  name: "serverowner",
  description: "Show this server's owner.",
  type: "message",
  aliases: ["owner"],
  syntax: "serverowner",
  example: "serverowner",
  context: "guild",
  run: async (ctx) => {
    const owner = await ctx.ownerStats();
    const avatar = owner.avatar();
    return ctx.reply(
      container()
        .accent(await owner.accent())
        .section(`## ${owner.tag}\n${owner.mention}`, thumb(avatar)),
    );
  },
});
