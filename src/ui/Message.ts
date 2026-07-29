import {
  MessageFlags,
  type Channel,
  type CreateMessageOptions,
} from "discordeno";
import type { DiscordBot } from "../core/Discord.ts";
import type { Container } from "./Container.ts";
import type { Embed } from "./Embed.ts";
import { readFileSync } from "node:fs";

export type MessageContent = string | Embed | Container;
export interface MessagePolicy {
  allowedMentions?: CreateMessageOptions["allowedMentions"];
}

export function messageOptions(
  value: MessageContent,
  ephemeral = false,
  policy: MessagePolicy = {},
): CreateMessageOptions {
  const privateFlag = ephemeral ? MessageFlags.Ephemeral : undefined;
  const allowedMentions = policy.allowedMentions ?? {
    parse: [],
    repliedUser: false,
  };
  if (typeof value === "string")
    return { content: value, flags: privateFlag, allowedMentions };
  if (value.kind === "embed")
    return { embeds: [value.toJSON()], flags: privateFlag, allowedMentions };
  return {
    components: [value.toJSON() as never],
    flags: ephemeral ? 32_768 | MessageFlags.Ephemeral : 32_768,
    files: value.files.map((file) => ({
      blob: new Blob([readFileSync(file.attachment)]),
      name: file.name,
    })),
    allowedMentions,
  };
}

export async function send(
  bot: DiscordBot,
  channel: Channel | bigint,
  value: MessageContent,
): Promise<void> {
  await bot.helpers.sendMessage(
    typeof channel === "bigint" ? channel : channel.id,
    messageOptions(value),
  );
}
