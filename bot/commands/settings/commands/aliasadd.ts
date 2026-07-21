import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { addAlias, commandSettings } from "../../../services/settings/commands.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "alias add",
  description: "Add a custom command alias in this server.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "alias add <alias> <command>",
  example: "alias add p play",
  args: {
    alias: { type: "string", required: true, description: "New single-word alias" },
    command: { type: "string", required: true, description: "Command name" },
  },
  run: async ctx => {
    const alias = ctx.string("alias")!.trim().toLowerCase();
    if (!/^[^\s]{1,32}$/.test(alias)) throw new UserError("Aliases must be one word and at most 32 characters.");
    if (ctx.commands.find(alias)) throw new UserError("That name already belongs to a command or built-in alias.");

    const command = ctx.commands.find(ctx.string("command")!);
    if (!command || command.type === "slash") throw new UserError("That message command does not exist.");
    const current = await commandSettings(ctx.guild!.id);
    if (alias in current.aliases) throw new UserError(`The **${alias}** alias already exists.`);

    await addAlias(ctx.guild!.id, alias, command.name);
    return ctx.reply(embeds.success(`Added **${alias}** as an alias for **${command.name}**.`));
  },
});
