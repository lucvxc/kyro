import { ChannelType } from "discord.js";
import { evt } from "../../../index.ts";
import { peak, start, track } from "../../features/stats/tracker.ts";

const voice = new Map<string, number>();

export default [
  evt({ name: "clientReady", once: true, run: () => start() }),
  evt({
    name: "messageCreate",
    run: (message) => {
      if (message.author.bot) return;
      track(message.guild?.id ?? null, "messages");
      track(message.guild?.id ?? null, "attachments", message.attachments.size);
      track(
        message.guild?.id ?? null,
        "links",
        message.content.match(/https?:\/\/\S+/g)?.length ?? 0,
      );
    },
  }),
  evt({
    name: "messageDelete",
    run: (message) => {
      if (!message.author?.bot) track(message.guild?.id ?? null, "deleted");
    },
  }),
  evt({
    name: "messageUpdate",
    run: (_, message) => {
      if (!message.author?.bot) track(message.guild?.id ?? null, "edited");
    },
  }),
  evt({
    name: "messageReactionAdd",
    run: (reaction, user) => {
      if (!user.bot) track(reaction.message.guild?.id ?? null, "reactions");
    },
  }),
  evt({
    name: "guildMemberAdd",
    run: (member) => track(member.guild.id, "membersJoined"),
  }),
  evt({
    name: "guildMemberRemove",
    run: (member) => track(member.guild.id, "membersLeft"),
  }),
  evt({
    name: "voiceStateUpdate",
    run: (before, after) => {
      if (after.member?.user.bot || before.member?.user.bot) return;
      const guild = after.guild;
      const key = `${guild.id}:${after.id}`;
      if (!before.channelId && after.channelId) {
        voice.set(key, Date.now());
        const count = guild.channels.cache
          .filter(
            (channel) =>
              channel.type === ChannelType.GuildVoice ||
              channel.type === ChannelType.GuildStageVoice,
          )
          .reduce((sum, channel) => sum + channel.members.size, 0);
        peak(guild.id, count);
      } else if (before.channelId && !after.channelId) {
        const since = voice.get(key);
        voice.delete(key);
        if (since)
          track(
            guild.id,
            "voiceSeconds",
            Math.floor((Date.now() - since) / 1_000),
          );
      }
    },
  }),
];
