import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "starboard selfstar",
  aliases: ["sb selfstar"],
  description: "Allow or block users from starring their own messages.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "starboard selfstar",
  example: "starboard selfstar",
  run: async (ctx) => {
    const current = (await communitySettings(ctx.guild!.id)).starboard;
    if (!current.channelId) throw new UserError("Set up starboard first.");
    const enabled = current.selfStar === false;
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: { ...value.starboard, selfStar: enabled },
    }));
    return ctx.reply(
      embeds.success(
        `Self stars are now **${enabled ? "enabled" : "disabled"}**.`,
      ),
    );
  },
});
