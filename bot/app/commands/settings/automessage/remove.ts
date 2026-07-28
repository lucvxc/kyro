import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { removeAutomessage } from "../../../../features/settings/automessages.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "automessage remove",
  aliases: ["am remove"],
  description: "Remove an automessage.",
  syntax: "automessage remove <id>",
  example: "automessage remove id",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    id: { type: "string", required: true, description: "Automessage ID" },
  },
  run: async (ctx) => {
    const id = ctx.string("id")!;
    if (!(await removeAutomessage(ctx.guild!.id, id)))
      throw new UserError("That automessage does not exist.");
    return ctx.reply(embeds.success(`Removed automessage **${id}**.`));
  },
});
