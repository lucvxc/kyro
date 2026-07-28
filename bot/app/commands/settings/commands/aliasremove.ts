import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { removeAlias } from "../../../../features/settings/commands.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "alias remove",
  description: "Remove a custom command alias from this server.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "alias remove <alias>",
  example: "alias remove p",
  args: {
    alias: { type: "string", required: true, description: "Custom alias" },
  },
  run: async (ctx) => {
    const alias = ctx.string("alias")!.trim().toLowerCase();
    if (!(await removeAlias(ctx.guild!.id, alias)))
      throw new UserError(`The **${alias}** alias does not exist.`);
    return ctx.reply(embeds.success(`Removed the **${alias}** alias.`));
  },
});
