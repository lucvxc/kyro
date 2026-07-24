import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import { toggleSticky } from "../../services/roles/sticky.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "stickyrole",
  description: "Toggle restoring member roles when they rejoin.",
  syntax: "stickyrole",
  example: "stickyrole",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  run: async (ctx) => {
    const enabled = await toggleSticky(ctx.guild!.id);
    return ctx.reply(
      embeds.success(
        `Sticky roles are now **${enabled ? "enabled" : "disabled"}**.`,
      ),
    );
  },
});
