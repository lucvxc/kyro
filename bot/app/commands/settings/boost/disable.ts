import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `boost disable`,
  description: `Disable boost messages without deleting the setup.`,
  syntax: "boost disable",
  example: "boost disable",
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).boost;
    if (!current.enabled)
      throw new UserError(`Boost messages are already disabled.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      boost: { ...value.boost, enabled: false },
    }));
    return ctx.reply(
      embeds.success(
        `Boost messages disabled. Your channel and message were kept.`,
      ),
    );
  },
});
