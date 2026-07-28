import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { ticketFor } from "../../../../features/tickets/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket rename",
  description: "Rename the current ticket channel.",
  syntax: "ticket rename <name>",
  example: "ticket rename billing-help",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  args: { name: { type: "string", required: true } },
  run: async (ctx) => {
    await ticketFor(ctx.message!.channelId);
    const channel = ctx.guild!.channels.cache.get(ctx.message!.channelId);
    if (!channel || !("setName" in channel))
      throw new UserError("This ticket channel is unavailable.");
    const name = ctx
      .string("name")!
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 90);
    if (!name) throw new UserError("Choose a valid channel name.");
    await channel.setName(name, `Ticket renamed by ${ctx.author.tag}`);
    return ctx.reply(embeds.success(`Ticket renamed to **${name}**.`));
  },
});
