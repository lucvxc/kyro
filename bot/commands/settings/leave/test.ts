import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { configuredMessage } from "../../../services/settings/communitymessages.ts";
import embeds from "../../../utils/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `leave test`,
  description: `Send a test leave message.`,
  syntax: "leave test",
  example: "leave test",
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.author.id);
    const result = await configuredMessage(
      ctx.guild!,
      "leave",
      ctx.author,
      member,
    );
    if (!result)
      throw new UserError(`Leave needs an enabled channel and message first.`);
    const channel =
      ctx.guild!.channels.cache.get(result.config.channelId!) ?? null;
    if (!channel?.isSendable())
      throw new UserError("The configured channel is unavailable.");
    await channel.send({ ...result.payload, allowedMentions: { parse: [] } });
    return ctx.reply(embeds.success(`Sent a test to ${channel}.`));
  },
});
