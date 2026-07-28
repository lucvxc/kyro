import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { updateFilters } from "../../../../features/settings/filters.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antilink unwhitelist",
  aliases: ["al unwhitelist"],
  description: "Remove a channel or role from the anti-link whitelist.",
  syntax: "antilink unwhitelist <target>",
  example: "antilink unwhitelist target",
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
      antilink: {
        ...value.antilink,
        whitelistedChannels: value.antilink.whitelistedChannels?.filter(
          (channelId) => channelId !== id,
        ),
        whitelistedRoles: value.antilink.whitelistedRoles?.filter(
          (roleId) => roleId !== id,
        ),
      },
    }));
    return ctx.reply(
      embeds.success(
        "Removed that channel or role from the anti-link whitelist.",
      ),
    );
  },
});
