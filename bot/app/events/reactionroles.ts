import { evt } from "../../../index.ts";
import { roleSettings } from "../../features/settings/roles.ts";

const add = evt({
  name: "messageReactionAdd",
  run: async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) {
      reaction = await reaction.fetch().catch(() => reaction);
    }
    const message = reaction.message.partial
      ? await reaction.message.fetch().catch(() => null)
      : reaction.message;
    if (!message?.guild) return;
    const menu = (await roleSettings(message.guild.id)).reactionRoles.find(
      (item) => item.messageId === message.id,
    );
    const roleId = menu?.roles.find((option) =>
      matches(reaction.emoji, option.emoji),
    )?.roleId;
    if (!roleId) return;
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      await member.roles.add(roleId, "Reaction role").catch(() => undefined);
    }
  },
});

const remove = evt({
  name: "messageReactionRemove",
  run: async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) {
      reaction = await reaction.fetch().catch(() => reaction);
    }
    const message = reaction.message.partial
      ? await reaction.message.fetch().catch(() => null)
      : reaction.message;
    if (!message?.guild) return;
    const menu = (await roleSettings(message.guild.id)).reactionRoles.find(
      (item) => item.messageId === message.id,
    );
    const roleId = menu?.roles.find((option) =>
      matches(reaction.emoji, option.emoji),
    )?.roleId;
    if (!roleId) return;
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      await member.roles
        .remove(roleId, "Reaction role removed")
        .catch(() => undefined);
    }
  },
});

function matches(
  emoji: { id: string | null; name: string | null; toString(): string },
  configured?: string,
): boolean {
  return Boolean(
    configured && [emoji.id, emoji.name, emoji.toString()].includes(configured),
  );
}

export default [add, remove];
