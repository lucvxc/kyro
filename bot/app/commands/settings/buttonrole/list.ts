import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { panels } from "../../../../features/roles/buttonpanels.ts";

export default cmd({
  name: "buttonrole list",
  aliases: ["buttonroles list", "br list"],
  description: "List messages with button roles.",
  syntax: "buttonrole list",
  example: "br list",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  run: async (ctx) => {
    const values = await panels(ctx.guild!.id);
    const rows = values
      .map(
        (item) =>
          `[Message](https://discord.com/channels/${ctx.guild!.id}/${item.channelId}/${item.messageId})  ·  ${item.roles.length}/25 roles  ·  ${item.mode}`,
      )
      .join("\n");
    await ctx.reply(
      container()
        .accent(0x5865f2)
        .text(`## Button role messages\n-# ${values.length} configured`)
        .separator()
        .text(rows || "No messages have button roles."),
    );
  },
});
