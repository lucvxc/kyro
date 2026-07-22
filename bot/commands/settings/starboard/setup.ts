import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateCommunity } from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];
const fallbackEmoji = "\u2B50";

export default cmd({
  name: "starboard setup",
  description: "Set up the starboard.",
  type: "message",
  context: "guild",
  permissions,
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "Starboard channel",
    },
    threshold: {
      type: "number",
      description: "Required reactions",
      default: 3,
    },
    emoji: {
      type: "string",
      description: "First reaction emoji",
      default: fallbackEmoji,
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isSendable()) {
      throw new UserError("Choose a channel where I can send messages.");
    }
    const threshold = validThreshold(ctx.number("threshold")!);
    const emoji = ctx.string("emoji")!;
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: {
        ...value.starboard,
        channelId: channel.id,
        emoji,
        emojis: [emoji],
        threshold,
        selfStar: true,
        thresholds: { [emoji]: threshold },
        messages: value.starboard.messages ?? {},
      },
    }));
    return ctx.reply(
      embeds.success(
        `Starboard set to ${channel} with ${emoji} at **${threshold}** reactions.`,
      ),
    );
  },
});

function validThreshold(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new UserError("Threshold must be between 1 and 50.");
  }
  return value;
}
