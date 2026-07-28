import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "banlist",
  aliases: ["bans"],
  description: "Show users banned from this server.",
  syntax: "banlist",
  example: "banlist",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.BanMembers],
  run: async (ctx) => {
    const bans = await ctx.guild!.bans.fetch({ limit: 100 });
    const list = [...bans.values()]
      .slice(0, 25)
      .map((ban) => `**${ban.user.tag}** · ${ban.user.id}`)
      .join("\n");
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## Banned Users\n-# ${bans.size} ban${bans.size === 1 ? "" : "s"}`,
        )
        .separator()
        .text(list || "No users are banned."),
    );
  },
});
