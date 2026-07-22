import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../services/settings/community.ts";
import { resolveSettingMessage } from "../../../services/settings/messages.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "leave message",
  description:
    "Set the leave message using text, a saved embed, or embed code.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "leave message <text, saved embed name/ID, or embed code>",
  example: "leave message welcome",
  run: async (ctx) => {
    const current = await communitySettings(ctx.guild!.id);
    if (!current.leave.channelId)
      throw new UserError(
        `Set a channel first with **${ctx.prefix}leave channel #channel**.`,
      );
    const input = ctx.raw.join(" ").trim();
    if (!input)
      throw new UserError(
        `Use **${ctx.prefix}leave message <text, saved embed name/ID, or embed code>**.`,
      );
    const message = await resolveSettingMessage(ctx.author.id, input);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      leave: { ...value.leave, message },
    }));
    return ctx.reply(
      embeds.success(
        `Leave message updated. Enable it with **${ctx.prefix}leave enable**.`,
      ),
    );
  },
});
