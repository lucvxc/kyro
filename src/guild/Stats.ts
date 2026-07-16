import { GuildVerificationLevel, type Guild, type GuildBasedChannel } from "discord.js";
import { dominant } from "../ui/Image.ts";

export class GuildStats {
  public constructor(private readonly guild: Guild) {}
  public get id(): string { return this.guild.id; }
  public get name(): string { return this.guild.name; }
  public get owner(): string { return this.guild.ownerId; }
  public get members(): number { return this.guild.memberCount; }
  public get roles(): number { return this.guild.roles.cache.size; }
  public get channels(): number { return this.guild.channels.cache.size; }
  public get boosts(): number { return this.guild.premiumSubscriptionCount ?? 0; }
  public get tier(): number { return this.guild.premiumTier; }
  public get emojis(): number { return this.guild.emojis.cache.size; }
  public get animated(): number { return this.guild.emojis.cache.filter(emoji => emoji.animated).size; }
  public get stickers(): number { return this.guild.stickers.cache.size; }
  public get created(): number { return Math.floor(this.guild.createdTimestamp / 1_000); }
  public get locale(): string { return this.guild.preferredLocale; }
  public get verification(): string { return GuildVerificationLevel[this.guild.verificationLevel]; }
  public get afkTimeout(): number { return this.guild.afkTimeout; }
  public get afkChannel(): string | null { return this.guild.afkChannel?.toString() ?? null; }
  public get maxMembers(): number { return this.guild.maximumMembers ?? 0; }
  public get features(): string[] { return this.guild.features.map(pretty); }
  public get vanity(): string | null { return this.guild.vanityURLCode ? `discord.gg/${this.guild.vanityURLCode}` : null; }
  public icon(extension: "png" | "jpg" | "webp" = "png"): string | null { return this.guild.iconURL({ size: 4096, extension }); }
  public banner(extension: "png" | "jpg" | "webp" = "png"): string | null { return this.guild.bannerURL({ size: 4096, extension }); }
  public splash(extension: "png" | "jpg" | "webp" = "png"): string | null { return this.guild.splashURL({ size: 4096, extension }); }
  public roleList(limit = 50): string[] {
    return [...this.guild.roles.cache.values()].filter(role => role.id !== this.guild.id).sort((a, b) => b.position - a.position).slice(0, limit).map(String);
  }
  public channelList(limit = 50): string[] {
    return [...this.guild.channels.cache.values()].sort((a, b) => position(a) - position(b)).slice(0, limit).map(String);
  }
  public emojiList(limit = this.guild.emojis.cache.size): string[] { return [...this.guild.emojis.cache.values()].slice(0, limit).map(String); }
  public async loadEmojis(): Promise<string[]> { await this.guild.emojis.fetch(); return this.emojiList(); }
  public stickerList(limit = 50): string[] { return [...this.guild.stickers.cache.values()].slice(0, limit).map(sticker => sticker.name); }
  public accent(): Promise<string> { const icon = this.icon(); return icon ? dominant(icon) : Promise.resolve("#5865F2"); }
}

function pretty(value: string): string { return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
function position(channel: GuildBasedChannel): number { return "rawPosition" in channel ? channel.rawPosition : 0; }

export type GuildWithStats = Guild & { readonly stats: GuildStats };

export function withStats(guild: Guild): GuildWithStats {
  if (!("stats" in guild)) Object.defineProperty(guild, "stats", { value: new GuildStats(guild), enumerable: false });
  return guild as GuildWithStats;
}
