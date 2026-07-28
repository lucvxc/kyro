import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `welcome enable`,
  description: `Enable welcome messages.`,
  syntax: "welcome enable",
  example: "welcome enable",
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).welcome;
    if (!current.channelId)
      throw new UserError(
        `Set a channel first with **${ctx.prefix}welcome channel #channel**.`,
      );
    if (!current.message)
      throw new UserError(
        `Set a message first with **${ctx.prefix}welcome message <message>**.`,
      );
    if (current.enabled)
      throw new UserError(`Welcome messages are already enabled.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      welcome: { ...value.welcome, enabled: true },
    }));
    return ctx.reply(
      embeds.success(`Welcome messages enabled in <#${current.channelId}>.`),
    );
  },
});
