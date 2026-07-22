import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { communitySettings } from "../../../services/settings/community.ts";
import { colors } from "../../../utils/config/config.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automessage list",
  description: "List scheduled messages.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const items = (await communitySettings(ctx.guild!.id)).automessages;
    if (!items.length)
      return ctx.reply(embeds.warning("No automessages are configured."));
    const lines = items.map(
      (item) =>
        `**${item.id}** <#${item.channelId}> ${item.enabled ? "Enabled" : "Disabled"}\n-# Every ${Math.round(item.interval / 60_000)} minutes`,
    );
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Automessages\n-# ${items.length}/10 configured`)
        .separator()
        .text(lines.join("\n\n")),
    );
  },
});
