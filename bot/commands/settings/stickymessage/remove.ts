import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "stickymessage remove",
  aliases: ["sticky remove"],
  description: "Remove this channel's sticky message.",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    const channel = ctx.message?.channel;
    if (!channel || channel.isDMBased())
      throw new UserError("Use this in a server channel.");
    const current = (
      await communitySettings(ctx.guild!.id)
    ).stickyMessages.find((item) => item.channelId === channel.id);
    if (!current) throw new UserError("This channel has no sticky message.");
    if (current.lastMessageId && channel.isTextBased()) {
      const old = await channel.messages
        .fetch(current.lastMessageId)
        .catch(() => null);
      await old?.delete().catch(() => undefined);
    }
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      stickyMessages: value.stickyMessages.filter(
        (item) => item.channelId !== channel.id,
      ),
    }));
    return ctx.reply(embeds.success("Sticky message removed."));
  },
});
