import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { updateFilters } from "../../../../features/settings/filters.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antiinvite whitelist",
  aliases: ["ainv whitelist"],
  description: "Allow invites in a channel or from a role.",
  syntax: "antiinvite whitelist <target>",
  example: "antiinvite whitelist target",
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
    const raw = ctx.string("target")!;
    const id = raw.match(/\d{17,20}/)?.[0];
    if (!id) throw new UserError("Mention a channel or role.");
    const isChannel = Boolean(ctx.guild!.channels.cache.get(id));
    const isRole = Boolean(ctx.guild!.roles.cache.get(id));
    if (!isChannel && !isRole)
      throw new UserError("That channel or role does not exist here.");
    await updateFilters(ctx.guild!.id, (value) => ({
      ...value,
      antiinvite: {
        ...value.antiinvite,
        whitelistedChannels: isChannel
          ? [...new Set([...(value.antiinvite.whitelistedChannels ?? []), id])]
          : value.antiinvite.whitelistedChannels,
        whitelistedRoles: isRole
          ? [...new Set([...(value.antiinvite.whitelistedRoles ?? []), id])]
          : value.antiinvite.whitelistedRoles,
      },
    }));
    return ctx.reply(
      embeds.success(
        `Invites are now allowed for ${isChannel ? `<#${id}>` : `<@&${id}>`}.`,
      ),
    );
  },
});
