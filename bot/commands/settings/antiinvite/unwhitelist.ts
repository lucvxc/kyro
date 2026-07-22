import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateFilters } from "../../../services/settings/filters.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antiinvite unwhitelist",
  description: "Remove a channel or role from the anti-invite whitelist.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    target: {
      type: "string",
      required: true,
      description: "Channel or role mention/ID",
    },
  },
  run: async (ctx) => {
    const id = ctx.string("target")!.match(/\d{17,20}/)?.[0];
    if (!id) throw new UserError("Mention a channel or role.");
    await updateFilters(ctx.guild!.id, (value) => ({
      ...value,
      antiinvite: {
        ...value.antiinvite,
        whitelistedChannels: value.antiinvite.whitelistedChannels?.filter(
          (channelId) => channelId !== id,
        ),
        whitelistedRoles: value.antiinvite.whitelistedRoles?.filter(
          (roleId) => roleId !== id,
        ),
      },
    }));
    return ctx.reply(
      embeds.success(
        "Removed that channel or role from the anti-invite whitelist.",
      ),
    );
  },
});
