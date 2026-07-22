import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `leave enable`,
  description: `Enable leave messages.`,
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).leave;
    if (!current.channelId)
      throw new UserError(
        `Set a channel first with **${ctx.prefix}leave channel #channel**.`,
      );
    if (!current.message)
      throw new UserError(
        `Set a message first with **${ctx.prefix}leave message <message>**.`,
      );
    if (current.enabled)
      throw new UserError(`Leave messages are already enabled.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      leave: { ...value.leave, enabled: true },
    }));
    return ctx.reply(
      embeds.success(`Leave messages enabled in <#${current.channelId}>.`),
    );
  },
});
