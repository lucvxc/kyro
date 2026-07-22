import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateFilters } from "../../../services/settings/filters.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antilink whitelist",
  description: "Allow links in a channel or from a role.",
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
      antilink: {
        ...value.antilink,
        whitelistedChannels: isChannel
          ? [...new Set([...(value.antilink.whitelistedChannels ?? []), id])]
          : value.antilink.whitelistedChannels,
        whitelistedRoles: isRole
          ? [...new Set([...(value.antilink.whitelistedRoles ?? []), id])]
          : value.antilink.whitelistedRoles,
      },
    }));
    return ctx.reply(
      embeds.success(
        `Links are now allowed for ${isChannel ? `<#${id}>` : `<@&${id}>`}.`,
      ),
    );
  },
});
