import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { communitySettings } from "../../../services/settings/community.ts";
import { colors } from "../../../utils/config/config.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "stickymessage list",
  aliases: ["sticky list"],
  description: "List this server's sticky messages.",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    const items = (await communitySettings(ctx.guild!.id)).stickyMessages;
    if (!items.length)
      return ctx.reply(embeds.warning("No sticky messages are configured."));
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`### Sticky Messages\n-# ${items.length} configured`)
        .separator()
        .text(
          items
            .map(
              (item) =>
                `**<#${item.channelId}>**\n-# ${(item.message || "Attachment or sticker").slice(0, 80)}`,
            )
            .join("\n\n"),
        ),
    );
  },
});
