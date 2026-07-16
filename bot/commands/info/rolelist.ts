import { cmd, container } from "../../../index.ts";

export default cmd({
  name: "roles",
  description: "List this server's roles.",
  type: "message",
  aliases: ["rolelist"],
  syntax: "roles",
  example: "roles",
  context: "guild",
  run: async (ctx) => {
    const roles = ctx.guild!.stats.roleList();
    const total = Math.max(0, ctx.guild!.stats.roles - 1);

    return ctx.reply(container()
      .accent(await ctx.guild!.stats.accent())
      .text(`## Roles in ${ctx.guild!.stats.name}\n-# ${total} ${total === 1 ? "role" : "roles"}`)
      .separator()
      .text(roles.join(" · ") || "No roles."));
  },
});
