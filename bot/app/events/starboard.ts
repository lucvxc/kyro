import { button, embed, evt, row } from "../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../features/settings/community.ts";

export default evt({
  name: "messageReactionAdd",
  run: async (reaction, user) => {
    if (reaction.partial)
      reaction = await reaction.fetch().catch(() => reaction);
    const message = reaction.message.partial
      ? await reaction.message.fetch().catch(() => null)
      : reaction.message;
    if (!message?.guild || user.bot) return;
    const config = (await communitySettings(message.guild.id)).starboard;
    if (!config.channelId) return;

    const configured = config.emojis?.length
      ? config.emojis
      : [config.emoji ?? "\u2B50"];
    const keys = [
      reaction.emoji.toString(),
      reaction.emoji.id,
      reaction.emoji.name,
    ].filter(Boolean);
    const emoji = configured.find((value) => keys.includes(value));
    if (!emoji || (config.selfStar === false && user.id === message.author?.id))
      return;
    const threshold = config.thresholds?.[emoji] ?? config.threshold ?? 3;
    if ((reaction.count ?? 0) < threshold) return;

    const channel = message.guild.channels.cache.get(config.channelId);
    if (!channel?.isSendable()) return;
    const content = `**${reaction.count ?? 0}** ${reaction.emoji} <#${message.channelId}>`;
    const existingId = config.messages?.[message.id];
    if (existingId) {
      const existing = await channel.messages
        .fetch(existingId)
        .catch(() => null);
      if (existing) {
        await existing.edit({ content }).catch(() => undefined);
        return;
      }
    }

    const card = embed()
      .author({
        name: message.author?.tag ?? "Unknown",
        icon: message.author?.displayAvatarURL(),
      })
      .desc(message.content || "*No content*")
      .time(message.createdAt);
    const image = message.attachments.find((file) =>
      file.contentType?.startsWith("image/"),
    );
    if (image) card.image(image.url);
    const sent = await channel.send({
      content,
      embeds: [card.toJSON()],
      components: [
        row(
          button({ style: "link", label: "Jump to message", url: message.url }),
        ),
      ],
      allowedMentions: { parse: [] },
    });
    await updateCommunity(message.guild.id, (value) => ({
      ...value,
      starboard: {
        ...value.starboard,
        messages: {
          ...(value.starboard.messages ?? {}),
          [message.id]: sent.id,
        },
      },
    }));
  },
});
