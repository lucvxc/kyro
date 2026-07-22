import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { keywordRule } from "../../../services/automod.ts";
import { colors } from "../../../utils/config/config.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automod keyword list",
  description: "List blocked keywords and phrases.",
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
