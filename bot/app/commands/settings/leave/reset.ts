import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `leave reset`,
  description: `Reset the entire leave message configuration.`,
  syntax: "leave reset",
  example: "leave reset",
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).leave;
    if (!Object.keys(current).length)
      throw new UserError(`Leave has no configuration to reset.`);
    await updateCommunity(ctx.guild!.id, (value) => ({ ...value, leave: {} }));
    return ctx.reply(embeds.success(`Leave configuration reset.`));
  },
});
