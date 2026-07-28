import { ChannelType, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  editTicketSettings,
  getTicketSettings,
} from "../../../../features/settings/tickets.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket setup",
  aliases: ["tickets setup"],
  description: "Set up the ticket category and staff role.",
  syntax: "ticket setup <staff role>",
  example: "ticket setup @Support",
  type: "message",
  context: "guild",
  permissions: [
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageChannels,
  ],
  args: {
    role: {
      type: "role",
      required: true,
      description: "Role that can manage tickets",
    },
  },
  run: async (ctx) => {
    const settings = await getTicketSettings(ctx.guild!.id);
    if (settings.categoryId) throw new UserError("Tickets are already set up.");
    const category = await ctx.guild!.channels.create({
      name: "Tickets",
      type: ChannelType.GuildCategory,
      reason: `Ticket setup by ${ctx.author.tag}`,
    });
    const log = await ctx.guild!.channels.create({
      name: "ticket-logs",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: ctx.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: ctx.role("role")!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: ctx.client.user!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
          ],
        },
      ],
      reason: `Ticket setup by ${ctx.author.tag}`,
    });
    await editTicketSettings(ctx.guild!.id, (value) => ({
      ...value,
      enabled: true,
      categoryId: category.id,
      logChannelId: log.id,
      staffRoleIds: [ctx.role("role")!.id],
      counter: 0,
    }));
    return ctx.reply(
      embeds.success(
        `Tickets are ready in **${category.name}** with logs in ${log}.`,
      ),
    );
  },
});
