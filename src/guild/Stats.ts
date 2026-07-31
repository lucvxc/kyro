import {
  VerificationLevels,
  guildBannerUrl,
  guildIconUrl,
  guildSplashUrl,
  snowflakeToTimestamp,
  type Guild,
  type ImageFormat,
} from "discordeno";
import { dominant } from "../ui/Image.ts";
export class GuildStats {
  public constructor(private readonly guild: Guild) {}
  public get id(): string {
    return String(this.guild.id);
  }
  public get name(): string {
    return this.guild.name;
  }
  public get owner(): string {
    return String(this.guild.ownerId);
  }
  public get members(): number {
    return this.guild.memberCount ?? this.guild.members?.size ?? 0;
  }
  public get roles(): number {
    return this.guild.roles.size;
  }
  public get channels(): number {
    return this.guild.channels.size;
  }
  public get boosts(): number {
    return this.guild.premiumSubscriptionCount ?? 0;
  }
  public get tier(): number {
    return this.guild.premiumTier;
  }
  public get emojis(): number {
    return this.guild.emojis.size;
  }
  public get animated(): number {
    return [...this.guild.emojis.values()].filter((emoji) => emoji.animated)
      .length;
  }
  public get stickers(): number {
    return this.guild.stickers?.size ?? 0;
  }
  public get created(): number {
    return Math.floor(snowflakeToTimestamp(this.guild.id) / 1_000);
  }
  public get locale(): string {
    return this.guild.preferredLocale;
  }
  public get verification(): string {
    return VerificationLevels[this.guild.verificationLevel];
  }
  public get afkTimeout(): number {
    return this.guild.afkTimeout;
  }
  public get afkChannel(): string | null {
    return this.guild.afkChannelId ? `<#${this.guild.afkChannelId}>` : null;
  }
  public get maxMembers(): number {
    return this.guild.maxMembers ?? 0;
  }
  public get features(): string[] {
    return Object.entries(this.guild.features)
      .filter(([, enabled]) => enabled)
      .map(([name]) => pretty(name));
  }
  public get vanity(): string | null {
    return this.guild.vanityUrlCode
      ? `discord.gg/${this.guild.vanityUrlCode}`
      : null;
  }
  public icon(format: ImageFormat = "png"): string | null {
    return this.guild.icon
      ? (guildIconUrl(this.guild.id, this.guild.icon, { size: 4096, format }) ??
          null)
      : null;
  }
  public banner(format: ImageFormat = "png"): string | null {
    return this.guild.banner
      ? (guildBannerUrl(this.guild.id, {
          banner: this.guild.banner,
          size: 4096,
          format,
        }) ?? null)
      : null;
  }
  public splash(format: ImageFormat = "png"): string | null {
    return this.guild.splash
      ? (guildSplashUrl(this.guild.id, this.guild.splash, {
          size: 4096,
          format,
        }) ?? null)
      : null;
  }
  public roleList(limit = 50): string[] {
    return [...this.guild.roles.values()]
      .filter((role) => role.id !== this.guild.id)
      .sort((a, b) => b.position - a.position)
      .slice(0, limit)
      .map((role) => `<@&${role.id}>`);
  }
  public channelList(limit = 50): string[] {
    return [...this.guild.channels.values()]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .slice(0, limit)
      .map((channel) => `<#${channel.id}>`);
  }
  public emojiList(limit = this.guild.emojis.size): string[] {
    return [...this.guild.emojis.values()]
      .slice(0, limit)
      .map(
        (emoji) => `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
      );
  }
  public loadEmojis(): Promise<string[]> {
    return Promise.resolve(this.emojiList());
  }
  public stickerList(limit = 50): string[] {
    return [...(this.guild.stickers?.values() ?? [])]
      .slice(0, limit)
      .map((sticker) => sticker.name);
  }
  public accent(): Promise<string> {
    const icon = this.icon();
    return icon ? dominant(icon) : Promise.resolve("#5865F2");
  }
}
function pretty(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export type GuildWithStats = Guild & { readonly stats: GuildStats };
export function withStats(guild: Guild): GuildWithStats {
  if (!("stats" in guild))
    Object.defineProperty(guild, "stats", {
      value: new GuildStats(guild),
      enumerable: false,
    });
  return guild as GuildWithStats;
}
