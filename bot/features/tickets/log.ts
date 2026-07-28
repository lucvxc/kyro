import { MessageFlags, type Guild } from "discord.js";
import { container } from "../../../index.ts";
import type { tickets } from "../../db/schema.ts";
import { colors } from "../../shared/config/constants.ts";
import { getTicketSettings } from "../settings/tickets.ts";

type Ticket = typeof tickets.$inferSelect;

export async function logTicket(
  guild: Guild,
  ticket: Ticket,
  action: string,
  actorId: string,
  file?: Buffer,
) {
  const settings = await getTicketSettings(guild.id);
  const channel = settings.logChannelId
    ? guild.channels.cache.get(settings.logChannelId)
    : null;
  if (!channel?.isSendable()) return;
  const view = container()
    .accent(colors.default)
    .text(
      `## Ticket ${action}\n-# Ticket ${ticket.number} · <#${ticket.channelId}>\n**Member** <@${ticket.userId}>\n**Action by** <@${actorId}>${ticket.claimedBy ? `\n**Claimed by** <@${ticket.claimedBy}>` : ""}`,
    );
  await channel
    .send({
      flags: MessageFlags.IsComponentsV2,
      components: [view.toJSON()],
      files: file
        ? [{ attachment: file, name: `ticket-${ticket.number}.html` }]
        : [],
      allowedMentions: { parse: [] },
    })
    .catch(() => undefined);
}
