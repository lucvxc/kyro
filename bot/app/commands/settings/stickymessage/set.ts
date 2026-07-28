import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import { expandMessage } from "../../../../features/settings/message.ts";
import embeds from "../../../../shared/config/embeds.ts";
import { parseGeneric, parseMessageFormat } from "../../../../shared/parser.ts";

export default cmd({
  name: "stickymessage set",
  aliases: ["sticky set"],
  description:
    "Set a sticky using text, a saved embed name or ID, or embed code.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "stickymessage set <text, saved embed name/ID, or embed code>",
  example: "stickymessage set rules",
  run: async (ctx) => {
    const channel = ctx.message?.channel;
    if (!channel?.isSendable() || channel.isDMBased()) {
      throw new UserError("Use this command in a server text channel.");
    }

    const input = ctx.raw.join(" ").trim();
    const attachments = [...ctx.message!.attachments.values()].map(
      (file) => file.url,
    );
    const stickerIds = [...ctx.message!.stickers.keys()];
    if (!input && !attachments.length && !stickerIds.length) {
      throw new UserError(
        `Use **${ctx.prefix}stickymessage set <text, saved embed name/ID, or embed code>**.`,
      );
    }

    const message = await expandMessage(ctx.author.id, input);

    const current = (
      await communitySettings(ctx.guild!.id)
    ).stickyMessages.find((item) => item.channelId === channel.id);
    if (current?.lastMessageId) {
      const old = await channel.messages
        .fetch(current.lastMessageId)
        .catch(() => null);
      await old?.delete().catch(() => undefined);
    }

    const sent = await channel.send({
      ...(message
        ? parseMessageFormat(parseGeneric(message, ctx.guild!, ctx.author))
        : {}),
      files: attachments,
      stickers: stickerIds,
      allowedMentions: { parse: [] },
    });
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      stickyMessages: [
        ...value.stickyMessages.filter((item) => item.channelId !== channel.id),
        {
          channelId: channel.id,
          enabled: true,
          message: message || undefined,
          attachments: attachments.length ? attachments : undefined,
          stickerIds: stickerIds.length ? stickerIds : undefined,
          lastMessageId: sent.id,
        },
      ],
    }));
    return ctx.reply(embeds.success(`Sticky message set in ${channel}.`));
  },
});
