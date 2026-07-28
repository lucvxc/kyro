import { MessageFlags } from "discord.js";
import { button, container } from "../../../index.ts";
import { colors } from "../../shared/config/constants.ts";

export function ticketPanel(guildId: string) {
  const card = container()
    .accent(colors.default)
    .text(
      "## Support Tickets\n-# Open a private ticket to contact the server staff.",
    )
    .separator()
    .row(
      button({
        id: `ticket:create:${guildId}`,
        label: "Create ticket",
        style: "secondary",
        emoji: { name: "🎫" },
      }),
    );
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [card.toJSON()],
  } as const;
}

export function ticketControls(ticketId: number, claimed = false) {
  const card = ticketControlView(ticketId, claimed);
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [card.toJSON()],
  } as const;
}

export function ticketControlView(ticketId: number, claimed = false) {
  return container()
    .accent(colors.default)
    .text(
      "## Ticket opened\n-# Explain what you need help with and a staff member will respond.",
    )
    .separator()
    .row(
      button({
        id: `ticket:${claimed ? "unclaim" : "claim"}:${ticketId}`,
        label: claimed ? "Unclaim" : "Claim",
        style: "secondary",
      }),
      button({
        id: `ticket:close:${ticketId}`,
        label: "Close",
        style: "secondary",
      }),
    );
}
