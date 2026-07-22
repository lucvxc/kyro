import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `welcome disable`,
  description: `Disable welcome messages without deleting the setup.`,
  type: "message",
  context: "guild",
  permissions: permission,
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).welcome;
    if (!current.enabled)
      throw new UserError(`Welcome messages are already disabled.`);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      welcome: { ...value.welcome, enabled: false },
    }));
    return ctx.reply(
      embeds.success(
        `Welcome messages disabled. Your channel and message were kept.`,
      ),
    );
  },
});
