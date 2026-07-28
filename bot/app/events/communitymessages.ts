import { evt } from "../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../features/settings/community.ts";
import { getPrefix } from "../../features/settings/prefix.ts";
import { parseGeneric, parseMessageFormat } from "../../shared/parser.ts";

export default evt({
  name: "messageCreate",
  run: async (message) => {
    if (!message.guild || message.author.bot) return;
    const settings = await communitySettings(message.guild.id);

    const command = message.content.startsWith(await getPrefix(message));
    const response = command
      ? undefined
      : settings.autoresponders.find((item) =>
          item.exact
            ? message.content.toLowerCase() === item.trigger.toLowerCase()
            : message.content
                .toLowerCase()
                .includes(item.trigger.toLowerCase()),
        );
    if (response?.delete) {
      await message.delete().catch(() => undefined);
    } else if (response) {
      await message
        .reply({
          ...parseMessageFormat(
            parseGeneric(response.response, message.guild, message.author),
          ),
          allowedMentions: { parse: [] },
        })
        .catch(() => undefined);
    }
    if (command) return;

    if (settings.counting.channelId === message.channelId) {
      const expected = (settings.counting.count ?? 0) + 1;
      const number = Number(message.content.trim());
      const repeated = settings.counting.lastUserId === message.author.id;
      if (!Number.isInteger(number) || number !== expected || repeated) {
        await message.delete().catch(() => undefined);
        await updateCommunity(message.guild.id, (value) => ({
          ...value,
          counting: {
            ...value.counting,
            count: 0,
            lastUserId: undefined,
          },
        }));
        const notice = await message.channel
          .send({
            content: repeated
              ? `${message.author} counted twice in a row. The streak ended at **${settings.counting.count ?? 0}**. Start again from **1**.`
              : `${message.author} broke the count. Expected **${expected}**. Start again from **1**.`,
            allowedMentions: { users: [message.author.id] },
          })
          .catch(() => null);
        if (notice) {
          setTimeout(() => void notice.delete().catch(() => undefined), 5_000);
        }
        return;
      }
      await updateCommunity(message.guild.id, (value) => ({
        ...value,
        counting: {
          ...value.counting,
          count: number,
          lastUserId: message.author.id,
          highScore: Math.max(number, value.counting.highScore ?? 0),
        },
      }));
      await message.react("✅").catch(() => undefined);
    }

    const index = settings.stickyMessages.findIndex(
      (item) => item.channelId === message.channelId,
    );
    if (
      index < 0 ||
      settings.stickyMessages[index]?.enabled === false ||
      !message.channel.isSendable()
    ) {
      return;
    }
    const sticky = settings.stickyMessages[index]!;
    if (sticky.lastMessageId) {
      const old = await message.channel.messages
        .fetch(sticky.lastMessageId)
        .catch(() => null);
      await old?.delete().catch(() => undefined);
    }
    const sent = await message.channel
      .send({
        ...(sticky.message
          ? parseMessageFormat(
              parseGeneric(sticky.message, message.guild, message.author),
            )
          : {}),
        files: sticky.attachments,
        stickers: sticky.stickerIds,
        allowedMentions: { parse: [] },
      })
      .catch(() => null);
    if (!sent) return;
    await updateCommunity(message.guild.id, (value) => ({
      ...value,
      stickyMessages: value.stickyMessages.map((item, at) =>
        at === index ? { ...item, lastMessageId: sent.id } : item,
      ),
    }));
  },
});
