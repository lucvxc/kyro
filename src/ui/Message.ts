import { MessageFlags, type GuildBasedChannel } from "discord.js";
import type { Container } from "./Container.ts";
import type { Embed } from "./Embed.ts";

export type MessageContent = string | Embed | Container;

export function messageOptions(
  value: MessageContent,
  ephemeral = false,
): object {
  const privateFlag = ephemeral ? MessageFlags.Ephemeral : undefined;
  const allowedMentions = { parse: [], repliedUser: false };
  if (typeof value === "string")
    return { content: value, flags: privateFlag, allowedMentions };
  if (value.kind === "embed")
    return { embeds: [value.toJSON()], flags: privateFlag, allowedMentions };
  return {
    components: [value.toJSON()],
    flags: ephemeral
      ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      : MessageFlags.IsComponentsV2,
    files: value.files,
    allowedMentions,
  };
}

export async function send(
  channel: GuildBasedChannel,
  value: MessageContent,
): Promise<void> {
  if (!channel.isSendable())
    throw new TypeError("Messages cannot be sent in that channel.");
  await channel.send(messageOptions(value) as never);
}
