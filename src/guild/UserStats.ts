import type { GuildMember, ImageExtension, User } from "discord.js";
import { dominant } from "../ui/Image.ts";

export class UserStats {
  public constructor(private readonly user: User, private readonly member: GuildMember | null) {}

  public get id(): string { return this.user.id; }
  public get name(): string { return this.user.username; }
  public get tag(): string { return this.user.tag; }
  public get mention(): string { return this.user.toString(); }
  public get bot(): boolean { return this.user.bot; }
  public get created(): number { return Math.floor(this.user.createdTimestamp / 1_000); }
  public get joined(): number | null { return this.member?.joinedTimestamp ? Math.floor(this.member.joinedTimestamp / 1_000) : null; }
  public get nickname(): string | null { return this.member?.nickname ?? null; }
  public get highestRole(): string | null { return this.member?.roles.highest.toString() ?? null; }
  public get inServer(): boolean { return this.member !== null; }
  public get permissions(): string[] { return this.member?.permissions.toArray().map(pretty) ?? []; }
  public get badges(): string[] { return this.user.flags?.toArray().map(pretty) ?? []; }
  public roles(limit = 50): string[] {
    if (!this.member) return [];
    return [...this.member.roles.cache.values()].filter(role => role.id !== this.member!.guild.id).sort((a, b) => b.position - a.position).slice(0, limit).map(String);
  }
  public avatar(extension: ImageExtension = "png"): string {
    return (this.member ?? this.user).displayAvatarURL({ size: 4096, extension });
  }
  public banner(extension: ImageExtension = "png"): string | null { return this.user.bannerURL({ size: 4096, extension }) ?? null; }
  public accent(source: "avatar" | "banner" = "avatar"): Promise<string> {
    return dominant(source === "banner" ? this.banner() ?? this.avatar() : this.avatar());
  }
}

function pretty(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
