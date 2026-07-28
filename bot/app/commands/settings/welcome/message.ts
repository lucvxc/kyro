import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import { expandMessage } from "../../../../features/settings/message.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "welcome message",
  aliases: ["wel message"],
  description:
    "Set the welcome message using text, a saved embed, or embed code.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "welcome message <text, saved embed name/ID, or embed code>",
  example: "welcome message welcome",
  run: async (ctx) => {
    const current = await communitySettings(ctx.guild!.id);
    if (!current.welcome.channelId)
      throw new UserError(
        `Set a channel first with **${ctx.prefix}welcome channel #channel**.`,
      );
    const input = ctx.raw.join(" ").trim();
    if (!input)
      throw new UserError(
        `Use **${ctx.prefix}welcome message <text, saved embed name/ID, or embed code>**.`,
      );
    const message = await expandMessage(ctx.author.id, input);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      welcome: { ...value.welcome, message },
    }));
    return ctx.reply(
      embeds.success(
        `Welcome message updated. Enable it with **${ctx.prefix}welcome enable**.`,
      ),
    );
  },
});
