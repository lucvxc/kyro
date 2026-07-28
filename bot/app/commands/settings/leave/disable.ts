import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `leave disable`,
  description: `Disable leave messages without deleting the setup.`,
  syntax: "leave disable",
  example: "leave disable",
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).leave;
    if (!current.enabled)
      throw new UserError(`Leave messages are already disabled.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      leave: { ...value.leave, enabled: false },
    }));
    return ctx.reply(
      embeds.success(
        `Leave messages disabled. Your channel and message were kept.`,
      ),
    );
  },
});
