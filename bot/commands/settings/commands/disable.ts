import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { disableCommand } from "../../../services/settings/commands.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "command disable",
  description: "Disable a command in this server.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "command disable <command>",
  example: "command disable play",
  args: {
    command: { type: "string", required: true, description: "Command name" },
  },
  run: async (ctx) => {
    const command = ctx.commands.find(ctx.string("command")!);
    if (!command || command.type === "slash")
      throw new UserError("That message command does not exist.");
    if (["command", "alias", "prefix"].includes(command.path[0]!)) {
      throw new UserError("Settings commands cannot be disabled.");
    }
    if (!(await disableCommand(ctx.guild!.id, command.name))) {
      throw new UserError(
        `The **${command.name}** command is already disabled.`,
      );
    }
    return ctx.reply(
      embeds.success(`Disabled **${command.name}** in this server.`),
    );
  },
});
