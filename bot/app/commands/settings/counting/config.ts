import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { communitySettings } from "../../../../features/settings/community.ts";
import { colors } from "../../../../shared/config/constants.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "counting config",
  aliases: ["count config"],
  description: "View counting progress.",
  syntax: "counting config",
  example: "counting config",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    const value = (await communitySettings(ctx.guild!.id)).counting;
    return ctx.reply(
      container()
        .accent(colors.default)
        .text("### Counting")
        .separator()
        .text(
          `${value.channelId ? `**Channel** <#${value.channelId}>\n**Current streak** ${value.count ?? 0}` : "**Status** Disabled"}\n**High score** ${value.highScore ?? 0}`,
        ),
    );
  },
});
