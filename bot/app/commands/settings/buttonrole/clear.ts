import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { clear, findMessage } from "../../../../features/roles/buttonpanels.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "buttonrole clear",
  aliases: ["buttonroles clear", "br clear"],
  description: "Remove every role button from a message.",
  syntax: "buttonrole clear <message>",
  example: "br clear 123456789012345678",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  args: { message: { type: "string", required: true } },
  run: async (ctx) => {
    const message = await findMessage(
      ctx.guild!,
      ctx.string("message")!,
      ctx.message!.channelId,
    );
    await clear(ctx.guild!, message);
    await ctx.reply(
      embeds.success("Removed all button roles from that message."),
    );
  },
});
