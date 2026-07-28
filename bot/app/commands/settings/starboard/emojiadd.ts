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
  name: "starboard emoji add",
  aliases: ["sb emoji add", "sb emojiadd"],
  description: "Add a starboard emoji.",
  syntax: "starboard emoji add <emoji> (threshold)",
  example: "starboard emoji add ⭐ 5",
  type: "message",
  context: "guild",
  permissions,
  args: {
    emoji: { type: "string", required: true, description: "Emoji to add" },
    threshold: { type: "number", description: "Required reactions" },
  },
  run: async (ctx) => {
    const emoji = ctx.string("emoji")!;
    const current = (await communitySettings(ctx.guild!.id)).starboard;
    if (!current.channelId) throw new UserError("Set up starboard first.");
    const emojis = configuredEmojis(current);
    if (emojis.includes(emoji)) {
      throw new UserError("That emoji is already configured.");
    }
    const threshold = validThreshold(
      ctx.number("threshold") ?? current.threshold ?? 3,
    );
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: {
        ...value.starboard,
        emojis: [...emojis, emoji],
        thresholds: {
          ...(value.starboard.thresholds ?? {}),
          [emoji]: threshold,
        },
      },
    }));
    return ctx.reply(
      embeds.success(`Added ${emoji} with a threshold of **${threshold}**.`),
    );
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
function validThreshold(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new UserError("Threshold must be between 1 and 50.");
  }
  return value;
}
