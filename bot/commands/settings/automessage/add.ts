import { PermissionFlagsBits } from "discord.js";
import { cmd, duration, UserError } from "../../../../index.ts";
import { addAutomessage } from "../../../services/settings/automessages.ts";
import { communitySettings } from "../../../services/settings/community.ts";
import { resolveSettingMessage } from "../../../services/settings/messages.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automessage add",
  description: "Schedule a repeating message.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "automessage add <channel> <interval> <message>",
  example: "automessage add #general 1h rules",
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "Destination channel",
    },
    interval: {
      type: "string",
      required: true,
      description: "Repeat interval",
    },
    message: {
      type: "string",
      required: true,
      description: "Text, saved embed name/ID, or embed code",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isSendable())
      throw new UserError("Choose a channel where I can send messages.");
    const interval = duration(ctx.string("interval")!);
    if (interval < 60_000 || interval > 604_800_000)
      throw new UserError("Interval must be between 1 minute and 7 days.");
    const current = await communitySettings(ctx.guild!.id);
    if (current.automessages.length >= 10)
      throw new UserError("This server can only have 10 automessages.");
    const message = await resolveSettingMessage(
      ctx.author.id,
      ctx.string("message")!,
    );
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
    await addAutomessage(
      ctx.guild!.id,
      {
        id,
        channelId: channel.id,
        interval,
        lastSent: Date.now(),
        enabled: true,
        message,
      },
      ctx.client,
    );
    return ctx.reply(
      embeds.success(`Added automessage **${id}** in ${channel}.`),
    );
  },
});
