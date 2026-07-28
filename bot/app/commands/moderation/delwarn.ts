import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { removeWarning } from "../../../features/moderation/warnings.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "delwarn",
  aliases: ["unwarn"],
  description: "Delete a warning by its ID.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  syntax: "delwarn <id>",
  example: "delwarn 12",
  args: { id: { type: "number", required: true } },
  run: async (ctx) => {
    const id = ctx.number("id")!;
    if (!Number.isInteger(id))
      throw new UserError("Warning IDs must be whole numbers.");
    const warning = await removeWarning(ctx.guild!.id, id);
    if (!warning)
      throw new UserError(`Warning #${id} does not exist in this server.`);
    return ctx.reply(embeds.success(`Deleted warning **#${id}**.`));
  },
});
