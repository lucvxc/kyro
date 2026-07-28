import { MessageFlags, type Guild, type TextChannel } from "discord.js";
import { button, container, thumb } from "../../../index.ts";
import { updateSecurity } from "./security.ts";

export function honeypotPanel(
  catches: number,
  accent: string,
  icon?: string | null,
) {
  const panel = container()
    .accent(accent)
    .section("## Honeypot\n-# Spam Bot", icon ? thumb(icon) : undefined)
    .separator()
    .text(
      "Do not post here. Anyone who sends a message, file, or sticker will be kicked.",
    )
    .row(
      button({
        id: "honeypot_count",
        label: `${catches.toLocaleString()} kicked`,
        style: "secondary",
        disabled: true,
      }),
    );
  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components: [panel.toJSON()],
  };
}

export async function updateHoneypotPanel(
  guild: Guild,
  channelId: string,
  messageId: string,
  catches: number,
  accent: string,
): Promise<void> {
  const channel = guild.channels.cache.get(channelId) as
    TextChannel | undefined;
  if (!channel?.isTextBased()) return;
  const panel = await channel.messages.fetch(messageId).catch(() => null);
  await panel
    ?.edit(
      honeypotPanel(
        catches,
        accent,
        guild.iconURL({ size: 256, extension: "png" }),
      ),
    )
    .catch(() => undefined);
  await updateSecurity(guild.id, (value) => ({
    ...value,
    honeypot: { ...value.honeypot, catches },
  }));
}
