import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `boost reset`,
  description: `Reset the entire boost message configuration.`,
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).boost;
    if (!Object.keys(current).length)
      throw new UserError(`Boost has no configuration to reset.`);
    await updateCommunity(ctx.guild!.id, (value) => ({ ...value, boost: {} }));
    return ctx.reply(embeds.success(`Boost configuration reset.`));
  },
});
