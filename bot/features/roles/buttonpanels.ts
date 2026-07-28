import {
  ActionRowBuilder,
  ButtonBuilder,
  type Guild,
  type Message,
  type Role,
} from "discord.js";
import { button, UserError } from "../../../index.ts";
import type { ButtonRole, ButtonRolePanel } from "../../db/settings.ts";
import { roleSettings, updateRoleSettings } from "../settings/roles.ts";

export type Style = ButtonRole["style"];

export async function panels(guildId: string) {
  return (await roleSettings(guildId)).buttonRoles;
}

export async function panel(guildId: string, messageId: string) {
  const found = (await panels(guildId)).find(
    (item) => item.messageId === messageId || item.id === messageId,
  );
  if (!found) throw new UserError("That message does not have button roles.");
  return found;
}

export async function add(
  guild: Guild,
  message: Message,
  role: Role,
  label: string,
  style: Style,
  emoji?: string,
) {
  ensureEditable(message);
  let updated: ButtonRolePanel | undefined;
  await updateRoleSettings(guild.id, (settings) => {
    const current =
      settings.buttonRoles.find((item) => item.messageId === message.id) ??
      create(message);
    if (
      current.roles.length >= 25 &&
      !current.roles.some((item) => item.roleId === role.id)
    )
      throw new UserError("A message can have at most 25 role buttons.");
    const item: ButtonRole = {
      roleId: role.id,
      label: label.slice(0, 80),
      style,
      emoji,
    };
    updated = {
      ...current,
      roles: [
        ...current.roles.filter((value) => value.roleId !== role.id),
        item,
      ],
    };
    return {
      ...settings,
      buttonRoles: [
        ...settings.buttonRoles.filter(
          (value) => value.messageId !== message.id,
        ),
        updated!,
      ],
    };
  });
  await sync(message, updated!);
  return updated!;
}

export async function update(
  guild: Guild,
  message: Message,
  change: (value: ButtonRolePanel) => ButtonRolePanel,
) {
  ensureEditable(message);
  let updated: ButtonRolePanel | undefined;
  await updateRoleSettings(guild.id, (settings) => ({
    ...settings,
    buttonRoles: settings.buttonRoles.map((item) =>
      item.messageId === message.id
        ? (updated = change(structuredClone(item)))
        : item,
    ),
  }));
  if (!updated) throw new UserError("That message does not have button roles.");
  await sync(message, updated);
  return updated;
}

export async function clear(guild: Guild, message: Message) {
  ensureEditable(message);
  const current = await panel(guild.id, message.id);
  await updateRoleSettings(guild.id, (settings) => ({
    ...settings,
    buttonRoles: settings.buttonRoles.filter(
      (item) => item.messageId !== message.id,
    ),
  }));
  await message.edit({ components: [] });
  return current;
}

export function rows(current: ButtonRolePanel) {
  const result: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let index = 0; index < current.roles.length; index += 5) {
    result.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        current.roles.slice(index, index + 5).map((item) =>
          button({
            id: `br:${current.id}:${item.roleId}`,
            label: item.label,
            style: item.style,
            emoji: componentEmoji(item.emoji),
          }),
        ),
      ),
    );
  }
  return result;
}

export function style(value?: string): Style {
  const key = value?.toLowerCase() ?? "secondary";
  const aliases: Record<string, Style> = {
    grey: "secondary",
    gray: "secondary",
    secondary: "secondary",
    blue: "primary",
    blurple: "primary",
    primary: "primary",
    green: "success",
    success: "success",
    red: "danger",
    danger: "danger",
  };
  const found = aliases[key];
  if (!found)
    throw new UserError("Button color must be grey, blue, green, or red.");
  return found;
}

export async function findMessage(
  guild: Guild,
  input: string,
  currentChannelId: string,
) {
  const link = input.match(
    /discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/,
  );
  const id = link?.[3] ?? input.match(/\d{17,20}/)?.[0];
  if (!id) throw new UserError("Provide a message ID or message link.");
  const channels = link?.[2]
    ? [guild.channels.cache.get(link[2])]
    : [
        guild.channels.cache.get(currentChannelId),
        ...guild.channels.cache.values(),
      ];
  for (const channel of channels) {
    if (!channel?.isTextBased() || channel.isDMBased()) continue;
    const message = await channel.messages.fetch(id).catch(() => null);
    if (message) return message;
  }
  throw new UserError("I could not find that message in this server.");
}

function create(message: Message): ButtonRolePanel {
  return {
    id: crypto.randomUUID().replaceAll("-", "").slice(0, 8),
    name: message.id,
    title: "",
    accent: "#5865F2",
    mode: "toggle",
    roles: [],
    channelId: message.channelId,
    messageId: message.id,
  };
}

function ensureEditable(message: Message) {
  if (message.author.id !== message.client.user.id)
    throw new UserError(
      "Choose a message sent by this bot. Discord does not let me attach buttons to another user's message.",
    );
}

async function sync(message: Message, current: ButtonRolePanel) {
  await message.edit({ components: rows(current) });
}

function componentEmoji(value?: string) {
  if (!value) return undefined;
  const custom = value.match(
    /^<(?<animated>a?):(?<name>[\w]+):(?<id>\d{17,20})>$/,
  )?.groups;
  return custom
    ? { id: custom.id, name: custom.name, animated: custom.animated === "a" }
    : { name: value };
}
