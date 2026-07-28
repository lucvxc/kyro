import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { deleteEmbed } from "../../../../features/settings/embeds.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "embed delete",
  aliases: ["emb delete"],
  description: "Delete a saved embed.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "embed delete <name>",
  example: "embed delete rules",
  args: {
    name: { type: "string", required: true, description: "Saved embed name" },
  },
  run: async (ctx) => {
    const query = ctx.string("name")!.trim();
    const deleted = await deleteEmbed(ctx.author.id, query);
    if (!deleted)
      throw new UserError(`No saved embed named **${query}** exists.`);
    return ctx.reply(
      embeds.success(`Deleted **${deleted.name}** · ID **${deleted.id}**.`),
    );
  },
});
