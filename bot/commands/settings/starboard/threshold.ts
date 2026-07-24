import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];
const fallbackEmoji = "\u2B50";

export default cmd({
  name: "starboard threshold",
  description: "Set the threshold for one starboard emoji.",
  syntax: "starboard threshold <emoji> <threshold>",
  example: "starboard threshold ⭐ 5",
  type: "message",
  context: "guild",
  permissions,
  args: {
    emoji: { type: "string", required: true, description: "Configured emoji" },
    threshold: {
      type: "number",
      required: true,
      description: "Required reactions",
    },
  },
  run: async (ctx) => {
    const emoji = ctx.string("emoji")!;
    const threshold = validThreshold(ctx.number("threshold")!);
    const current = (await communitySettings(ctx.guild!.id)).starboard;
    if (!configuredEmojis(current).includes(emoji)) {
      throw new UserError("That emoji is not configured.");
    }
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: {
        ...value.starboard,
        thresholds: {
          ...(value.starboard.thresholds ?? {}),
          [emoji]: threshold,
        },
      },
    }));
    return ctx.reply(
      embeds.success(`Set ${emoji} to **${threshold}** reactions.`),
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
