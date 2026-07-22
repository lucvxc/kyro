import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "stickymessage enable",
  aliases: ["sticky enable"],
  description: "Enable a saved sticky message.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const channelId = ctx.input.channelId;
    const current = (
      await communitySettings(ctx.guild!.id)
    ).stickyMessages.find((item) => item.channelId === channelId);
    if (!current) throw new UserError("That channel has no sticky message.");
    if (current.enabled !== false)
      throw new UserError("That sticky message is already enabled.");

    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      stickyMessages: value.stickyMessages.map((item) =>
        item.channelId === channelId ? { ...item, enabled: true } : item,
      ),
    }));
    return ctx.reply(
      embeds.success(`Enabled the sticky message in <#${channelId}>.`),
    );
  },
});
