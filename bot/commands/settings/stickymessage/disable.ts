import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "stickymessage disable",
  aliases: ["sticky disable"],
  description: "Disable a sticky message without deleting it.",
  syntax: "stickymessage disable",
  example: "stickymessage disable",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const channelId = ctx.input.channelId;
    const current = (
      await communitySettings(ctx.guild!.id)
    ).stickyMessages.find((item) => item.channelId === channelId);
    if (!current) throw new UserError("That channel has no sticky message.");
    if (current.enabled === false)
      throw new UserError("That sticky message is already disabled.");

    if (current.lastMessageId) {
      const channel = ctx.guild!.channels.cache.get(channelId);
      if (channel?.isTextBased()) {
        const message = await channel.messages
          .fetch(current.lastMessageId)
          .catch(() => null);
        await message?.delete().catch(() => undefined);
      }
    }
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      stickyMessages: value.stickyMessages.map((item) =>
        item.channelId === channelId
          ? { ...item, enabled: false, lastMessageId: undefined }
          : item,
      ),
    }));
    return ctx.reply(
      embeds.success(`Disabled the sticky message in <#${channelId}>.`),
    );
  },
});
