import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "autoresponder remove",
  aliases: ["autoresp remove"],
  description: "Remove an automatic response.",
  syntax: "autoresponder remove <trigger>",
  example: "autoresponder remove trigger",
  type: "message",
  context: "guild",
  permissions,
  args: {
    trigger: {
      type: "string",
      required: true,
      description: "Trigger to remove",
    },
  },
  run: async (ctx) => {
    const trigger = ctx.string("trigger")!;
    const current = await communitySettings(ctx.guild!.id);
    if (
      !current.autoresponders.some(
        (item) => item.trigger.toLowerCase() === trigger.toLowerCase(),
      )
    )
      throw new UserError("That autoresponder does not exist.");
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      autoresponders: value.autoresponders.filter(
        (item) => item.trigger.toLowerCase() !== trigger.toLowerCase(),
      ),
    }));
    return ctx.reply(
      embeds.success(`Removed the **${trigger}** autoresponder.`),
    );
  },
});
