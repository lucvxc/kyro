import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { updateCommunity } from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "autoresponder add",
  aliases: ["autoresp add"],
  description: "Add an automatic response.",
  example: "autoresponder add",
  type: "message",
  context: "guild",
  permissions,
  syntax: 'autoresponder add "trigger" <response>',
  run: async (ctx) => {
    const trigger = ctx.raw[0]?.trim();
    const response = ctx.raw.slice(1).join(" ").trim();
    if (!trigger || !response)
      throw new UserError(
        `Use **${ctx.prefix}autoresponder add "trigger" <response>**.`,
      );
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      autoresponders: [
        ...value.autoresponders.filter(
          (item) => item.trigger.toLowerCase() !== trigger.toLowerCase(),
        ),
        { trigger, response },
      ],
    }));
    return ctx.reply(
      embeds.success(`Added an autoresponder for **${trigger}**.`),
    );
  },
});
