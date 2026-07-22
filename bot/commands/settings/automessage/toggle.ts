import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { toggleAutomessage } from "../../../services/settings/automessages.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "automessage toggle",
  description: "Toggle an automessage.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    id: { type: "string", required: true, description: "Automessage ID" },
  },
  run: async (ctx) => {
    const id = ctx.string("id")!;
    const enabled = await toggleAutomessage(ctx.guild!.id, id, ctx.client);
    if (enabled === undefined)
      throw new UserError("That automessage does not exist.");
    return ctx.reply(
      embeds.success(
        `Automessage **${id}** is now **${enabled ? "enabled" : "disabled"}**.`,
      ),
    );
  },
});
