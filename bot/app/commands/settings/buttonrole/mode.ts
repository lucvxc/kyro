import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  findMessage,
  update,
} from "../../../../features/roles/buttonpanels.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "buttonrole mode",
  aliases: ["buttonroles mode", "br mode"],
  description: "Set whether a message allows one or multiple roles.",
  syntax: "buttonrole mode <message> <toggle/single>",
  example: "br mode 123456789012345678 single",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: {
    message: { type: "string", required: true },
    mode: { type: "string", required: true },
  },
  run: async (ctx) => {
    const mode = ctx.string("mode")!.toLowerCase();
    if (mode !== "toggle" && mode !== "single")
      throw new UserError("Mode must be `toggle` or `single`.");
    const message = await findMessage(
      ctx.guild!,
      ctx.string("message")!,
      ctx.message!.channelId,
    );
    await update(ctx.guild!, message, (current) => ({ ...current, mode }));
    await ctx.reply(embeds.success(`Button role mode set to **${mode}**.`));
  },
});
