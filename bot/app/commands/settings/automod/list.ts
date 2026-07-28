import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "automod list",
  aliases: ["amod list"],
  description: "List this server's Discord AutoMod rules.",
  syntax: "automod list",
  example: "automod list",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const rules = await ctx.guild!.autoModerationRules.fetch();
    if (!rules.size)
      return ctx.reply(embeds.warning("This server has no AutoMod rules."));
    const lines = rules
      .map(
        (rule) =>
          `**${rule.name}**\n-# ${rule.enabled ? "Enabled" : "Disabled"} · ${rule.triggerType}`,
      )
      .join("\n\n");
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## AutoMod rules\n-# ${rules.size} configured`)
        .separator()
        .text(lines),
    );
  },
});
