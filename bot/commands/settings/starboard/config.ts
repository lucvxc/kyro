import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../index.ts";
import { communitySettings } from "../../../services/settings/community.ts";
import { colors } from "../../../utils/config/config.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "starboard config",
  description: "View the starboard configuration.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const config = (await communitySettings(ctx.guild!.id)).starboard;
    if (!config.channelId)
      return ctx.reply(embeds.warning("Starboard is not configured."));

    const emojis = config.emojis?.length
      ? config.emojis
      : [config.emoji ?? "\u2B50"];
    const reactions = emojis
      .map((emoji) => {
        const threshold = config.thresholds?.[emoji] ?? config.threshold ?? 3;
        return `${emoji} **${threshold}**`;
      })
      .join("\n");

    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `### Starboard\n-# ${emojis.length} emoji${emojis.length === 1 ? "" : "s"} configured`,
        )
        .separator()
        .text(
          `**Channel** <#${config.channelId}>\n` +
            `**Self stars** ${config.selfStar === false ? "Disabled" : "Enabled"}\n` +
            `**Reactions**\n${reactions}`,
        ),
    );
  },
});
