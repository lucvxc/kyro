import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `boost enable`,
  description: `Enable boost messages.`,
  syntax: "boost enable",
  example: "boost enable",
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).boost;
    if (!current.channelId)
      throw new UserError(
        `Set a channel first with **${ctx.prefix}boost channel #channel**.`,
      );
    if (!current.message)
      throw new UserError(
        `Set a message first with **${ctx.prefix}boost message <message>**.`,
      );
    if (current.enabled)
      throw new UserError(`Boost messages are already enabled.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      boost: { ...value.boost, enabled: true },
    }));
    return ctx.reply(
      embeds.success(`Boost messages enabled in <#${current.channelId}>.`),
    );
  },
});
