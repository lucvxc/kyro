import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { communitySettings } from "../../../../features/settings/community.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "autoresponder list",
  aliases: ["autoresp list"],
  description: "List automatic responses.",
  syntax: "autoresponder list",
  example: "autoresponder list",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    const items = (await communitySettings(ctx.guild!.id)).autoresponders;
    if (!items.length)
      return ctx.reply(embeds.warning("No autoresponders are configured."));
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`### Autoresponders\n-# ${items.length} configured`)
        .separator()
        .text(
          items
            .map(
              (item, index) =>
                `**${index + 1}. ${item.trigger}**\n-# ${item.response.slice(0, 120)}`,
            )
            .join("\n\n"),
        ),
    );
  },
});
