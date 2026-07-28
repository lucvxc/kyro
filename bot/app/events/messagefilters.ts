import { PermissionFlagsBits } from "discord.js";
import { evt } from "../../../index.ts";
import { filterSettings } from "../../features/settings/filters.ts";
import type { MessageFilterSettings } from "../../db/settings.ts";

const linkPattern = /(?:https?:\/\/|www\.)\S+/i;
const invitePattern = /(?:discord\.gg|discord(?:app)?\.com\/invite)\/[\w-]+/i;

export default evt({
  name: "messageCreate",
  run: async (message) => {
    if (!message.guild || !message.member || message.author.bot) return;
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return;

    const settings = await filterSettings(message.guild.id);
    if (invitePattern.test(message.content)) {
      await enforce(
        message,
        settings.antiinvite,
        "Discord invites are not allowed here.",
      );
      return;
    }
    if (linkPattern.test(message.content)) {
      await enforce(message, settings.antilink, "Links are not allowed here.");
    }
  },
});

async function enforce(
  message: import("discord.js").Message,
  settings: MessageFilterSettings,
  notice: string,
): Promise<void> {
  if (!settings.enabled) return;
  if (settings.whitelistedChannels?.includes(message.channelId)) return;
  if (
    message.member?.roles.cache.some((role) =>
      settings.whitelistedRoles?.includes(role.id),
    )
  )
    return;

  await message.delete().catch(() => undefined);
  if (!message.channel.isSendable()) return;
  const reply = await message.channel
    .send({
      content: `${message.author}, ${notice}`,
      allowedMentions: { users: [message.author.id] },
    })
    .catch(() => null);
  if (reply)
    setTimeout(() => void reply.delete().catch(() => undefined), 5_000);

  const action = settings.punishment ?? "delete";
  if (action === "timeout" && message.member?.moderatable) {
    await message.member.timeout(300_000, notice).catch(() => undefined);
  } else if (action === "kick" && message.member?.kickable) {
    await message.member.kick(notice).catch(() => undefined);
  } else if (action === "ban" && message.member?.bannable) {
    await message.member.ban({ reason: notice }).catch(() => undefined);
  }
}
