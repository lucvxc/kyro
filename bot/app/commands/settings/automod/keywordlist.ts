import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { keywordRule } from "../../../../features/settings/automod.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "automod keyword list",
  aliases: ["amod keyword list", "amod keywordlist"],
  description: "List blocked keywords and phrases.",
  syntax: "automod keyword list",
  example: "automod keyword list",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const keywords =
      (await keywordRule(ctx.guild!))?.triggerMetadata.keywordFilter ?? [];
    if (!keywords.length)
      return ctx.reply(embeds.warning("No keywords are blocked."));
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Blocked keywords\n-# ${keywords.length} configured`)
        .separator()
        .text(keywords.map((value) => `\`${value}\``).join(", ")),
    );
  },
});
