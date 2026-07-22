import { cmd, embed } from "../../../index.ts";
import { colors } from "../../utils/config/config.ts";

export default cmd({
  name: "membercount",
  description: "Show this server's member count.",
  type: "message",
  aliases: ["members", "mc"],
  syntax: "membercount",
  example: "membercount",
  context: "guild",
  run: (ctx) =>
    ctx.reply(
      embed({
        color: colors.default,
        description: `**${ctx.guild!.stats.name}** has **${ctx.guild!.stats.members.toLocaleString()}** members`,
      }),
    ),
});
