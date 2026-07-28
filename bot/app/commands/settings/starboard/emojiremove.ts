import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];
const fallbackEmoji = "\u2B50";

export default cmd({
  name: "starboard emoji remove",
  aliases: ["sb emoji remove", "sb emojiremove"],
  description: "Remove a starboard emoji.",
  syntax: "starboard emoji remove <emoji>",
  example: "starboard emoji remove ⭐",
  type: "message",
  context: "guild",
  permissions,
  args: {
    emoji: { type: "string", required: true, description: "Emoji to remove" },
  },
  run: async (ctx) => {
    const emoji = ctx.string("emoji")!;
    const current = (await communitySettings(ctx.guild!.id)).starboard;
    const emojis = configuredEmojis(current);
    if (!emojis.includes(emoji)) {
      throw new UserError("That emoji is not configured.");
    }
    if (emojis.length === 1) {
      throw new UserError(
        "Starboard needs at least one emoji. Add another before removing this one.",
      );
    }
    const thresholds = { ...(current.thresholds ?? {}) };
    delete thresholds[emoji];
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: {
        ...value.starboard,
        emoji: emojis.filter((item) => item !== emoji)[0],
        emojis: emojis.filter((item) => item !== emoji),
        thresholds,
      },
    }));
    return ctx.reply(embeds.success(`Removed ${emoji} from starboard.`));
  },
});

function configuredEmojis(value: {
  emoji?: string;
  emojis?: string[];
}): string[] {
  return [
    ...new Set(
      value.emojis?.length ? value.emojis : [value.emoji ?? fallbackEmoji],
    ),
  ];
}
