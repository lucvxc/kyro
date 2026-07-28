import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  getCommandSettings,
  enableCommand,
} from "../../../../features/settings/commands.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "command enable",
  description: "Enable a disabled command in this server.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "command enable <command>",
  example: "command enable play",
  args: {
    command: { type: "string", required: true, description: "Command name" },
  },
  run: async (ctx) => {
    const input = ctx.string("command")!.trim().toLowerCase();
    const command = ctx.commands.find(input);
    const name =
      command?.name ??
      (await getCommandSettings(ctx.guild!.id)).disabled.find(
        (value) => value === input,
      );
    if (!name || !(await enableCommand(ctx.guild!.id, name)))
      throw new UserError("That command is not disabled.");
    return ctx.reply(embeds.success(`Enabled **${name}** in this server.`));
  },
});
