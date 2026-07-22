import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `welcome reset`,
  description: `Reset the entire welcome message configuration.`,
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).welcome;
    if (!Object.keys(current).length)
      throw new UserError(`Welcome has no configuration to reset.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      welcome: {},
    }));
    return ctx.reply(embeds.success(`Welcome configuration reset.`));
  },
});
