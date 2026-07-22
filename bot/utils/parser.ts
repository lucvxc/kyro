import type { Guild, GuildBasedChannel, GuildMember, User } from "discord.js";
import {
  ChannelStats,
  GuildStats,
  UserStats,
  compact,
  embed,
  fill,
  time,
  unix,
  type Embed,
} from "../../index.ts";

export interface ParsedEmbed {
  content?: string;
  embed: Embed;
}

export interface ParsedMessage {
  content?: string;
  embeds?: ReturnType<Embed["toJSON"]>[];
}

export interface ParseOptions {
  allowVariableUrls?: boolean;
}

export function parseEmbedFormat(
  input: string,
  options: ParseOptions = {},
): ParsedEmbed {
  const card = embed();
  let content: string | undefined;

  for (const directive of input.split("$v").map(unwrap).filter(Boolean)) {
    if (directive === "embed") continue;
    if (directive === "timestamp") {
      card.time();
      continue;
    }

    if (directive.startsWith("field:")) {
      const [name, value, inline] = directive.slice(6).split("|").map(clean);
      if (name && value) card.field(name, value, inline === "true");
      continue;
    }

    if (directive.includes(" && ")) {
      const values = Object.fromEntries(
        directive.split(" && ").map((part) => pair(part)),
      );
      if (values.author)
        card.author({
          name: values.author,
          icon: values.authoricon,
          url: values.authorurl,
        });
      if (values.footer)
        card.footer({ text: values.footer, icon: values.footericon });
      continue;
    }

    const [key, value] = pair(directive);
    if (key === "content") content = value;
    else apply(card, key, value, options);
  }

  return { content, embed: card };
}

export function parseMessageFormat(
  input: string,
  options: ParseOptions = {},
): ParsedMessage {
  if (!isEmbedFormat(input)) return { content: input };

  const parsed = parseEmbedFormat(input, options);
  if (!parsed.content && parsed.embed.empty) return { content: input };

  return {
    content: parsed.content,
    embeds: parsed.embed.empty ? undefined : [parsed.embed.toJSON()],
  };
}

export function isEmbedFormat(input: string): boolean {
  return (
    /\$v/i.test(input) ||
    /\{(?:embed|timestamp)\}/i.test(input) ||
    /\{(?:content|title|description|color|url|thumbnail|image|field)\s*:/i.test(
      input,
    ) ||
    /\{(?:author|footer)\s*&&/i.test(input)
  );
}

export function parseWelcome(
  input: string,
  member: GuildMember,
  guild: Guild,
): string {
  const user = new UserStats(member.user, null);
  return fill(input, {
    ...userVars(member.user),
    ...guildVars(guild),
    "{user.mention}": member.toString(),
    "{user.avatar}": user.avatar(),
    "{member.joinedAt}": member.joinedAt ? time(member.joinedAt) : "",
    "{member.joinedAt.timestamp}": member.joinedAt ? unix(member.joinedAt) : "",
    "{member.joinedAt.relative}": member.joinedAt
      ? time(member.joinedAt, "R")
      : "",
    "{member.createdAt}": time(member.user.createdAt),
    "{member.createdAt.timestamp}": unix(member.user.createdAt),
    "{member.createdAt.relative}": time(member.user.createdAt, "R"),
  });
}

export function parseTicketWelcome(
  input: string,
  userId: string,
  ticket: string,
  guildName: string,
  guild?: Guild,
): string {
  return fill(input, {
    ...guildVars(guild, guildName),
    "{user.id}": userId,
    "{user.mention}": `<@${userId}>`,
    "{ticket}": ticket,
  });
}

export function parseLeave(input: string, user: User, guild: Guild): string {
  return fill(input, {
    ...userVars(user),
    ...guildVars(guild),
    "{user.createdAt}": time(user.createdAt),
    "{user.createdAt.relative}": time(user.createdAt, "R"),
  });
}

export function parseBoost(input: string, user: User, guild: Guild): string {
  return fill(input, {
    ...userVars(user),
    ...guildVars(guild),
    "{server.boosts}": guild.premiumSubscriptionCount ?? 0,
    "{server.tier}": guild.premiumTier,
  });
}

export function parseNuke(
  input: string,
  user: User,
  channel: GuildBasedChannel,
  guild: Guild,
): string {
  const info = new ChannelStats(channel);
  return fill(input, {
    ...userVars(user),
    ...guildVars(guild),
    "{channel}": `<#${info.id}>`,
    "{channel.name}": info.name,
    "{channel.id}": info.id,
    "{server.boosts}": guild.premiumSubscriptionCount ?? 0,
    "{server.tier}": guild.premiumTier,
  });
}

export function parseGiveaway(
  input: string,
  prize: string,
  winners: number,
  endTime: number,
  hostId: string,
  guildName: string,
  guild?: Guild,
): string {
  const end = unix(endTime);
  return fill(input, {
    ...guildVars(guild, guildName),
    "{prize}": prize,
    "{winners}": winners,
    "{host}": `<@${hostId}>`,
    "{host.id}": hostId,
    "{endtime}": time(end),
    "{endtime.relative}": time(end, "R"),
    "{endtime.timestamp}": end,
  });
}

export function parseLastFM(
  input: string,
  track: string,
  artist: string,
  album: string | null,
  trackUrl: string,
  imageUrl: string | null,
  nowPlaying: boolean,
  username: string,
  userId: string,
  dominantColor: string,
  userAvatarUrl?: string | null,
  userTag?: string,
  guild?: Guild,
): string {
  return fill(input, {
    ...guildVars(guild),
    "{track}": track,
    "{artist}": artist,
    "{album}": album ?? "Unknown Album",
    "{track.url}": trackUrl,
    "{image}": imageUrl ?? "",
    "{color}": dominantColor,
    "{status}": nowPlaying ? "Now playing" : "Last played",
    "{nowplaying}": String(nowPlaying),
    "{lastfm}": username,
    "{user.id}": userId,
    "{user.mention}": `<@${userId}>`,
    "{user.tag}": userTag ?? username,
    "{user.avatar}": userAvatarUrl ?? "",
  });
}

export function parseVanity(
  input: string,
  user: User,
  guild: Guild,
  vanity: string,
): string {
  return fill(input, {
    ...userVars(user),
    ...guildVars(guild),
    "{vanity}": vanity,
    "{timestamp}": `<t:${unix()}>`,
  });
}

export function parseGeneric(input: string, guild: Guild, user: User): string {
  return fill(input, { ...userVars(user), ...guildVars(guild) });
}

function apply(
  card: Embed,
  key: string,
  value: string,
  options: ParseOptions,
): void {
  const safeUrl = !options.allowVariableUrls || !/\{[^}]+\}/.test(value);
  if (key === "title") card.title(value);
  else if (key === "description") card.desc(value);
  else if (key === "color") card.color(value);
  else if (key === "url" && safeUrl) card.url(value);
  else if (key === "thumbnail" && safeUrl) card.thumb(value);
  else if (key === "image" && safeUrl) card.image(value);
}

function pair(value: string): [string, string] {
  const colon = value.indexOf(":");
  if (colon < 0) return [value, ""];
  return [
    value.slice(0, colon).trim(),
    clean(value.slice(colon + 1)).replace(/\\n/g, "\n"),
  ];
}

function clean(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

function unwrap(value: string): string {
  return clean(value).replace(/^\{|\}$/g, "");
}

function userVars(user: User): Record<string, string> {
  const info = new UserStats(user, null);
  return {
    "{user}": info.name,
    "{user.tag}": info.tag,
    "{user.id}": info.id,
    "{user.mention}": `<@${info.id}>`,
    "{user.avatar}": info.avatar(),
  };
}

function guildVars(
  guild?: Guild,
  fallback = "",
): Record<string, string | number> {
  if (!guild)
    return {
      "{server}": fallback,
      "{server.id}": "",
      "{server.count}": 0,
      "{server.count.format}": "0",
      "{server.icon}": "",
      "{server.pfp}": "",
      "{server.banner}": "",
      "{date}": time(),
      "{time}": time(Date.now(), "R"),
    };

  const info = new GuildStats(guild);
  return {
    "{server}": info.name,
    "{server.id}": info.id,
    "{server.count}": info.members,
    "{server.count.format}": compact(info.members),
    "{server.icon}": info.icon() ?? "",
    "{server.pfp}": info.icon() ?? "",
    "{server.banner}": info.banner() ?? "",
    "{date}": time(),
    "{time}": time(Date.now(), "R"),
  };
}
