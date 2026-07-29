import {
  avatarUrl,
  bannerUrl,
  calculatePermissions,
  memberAvatarUrl,
  snowflakeToTimestamp,
  type ImageFormat,
  type Member,
  type User,
} from "discordeno";
import { dominant } from "../ui/Image.ts";
export class UserStats {
  public constructor(
    private readonly user: User,
    private readonly member: Member | null,
  ) {}
  public get id(): string {
    return String(this.user.id);
  }
  public get name(): string {
    return this.user.username;
  }
  public get tag(): string {
    return this.user.tag;
  }
  public get mention(): string {
    return `<@${this.user.id}>`;
  }
  public get bot(): boolean {
    return this.user.bot;
  }
  public get created(): number {
    return Math.floor(snowflakeToTimestamp(this.user.id) / 1_000);
  }
  public get joined(): number | null {
    return this.member?.joinedAt
      ? Math.floor(this.member.joinedAt / 1_000)
      : null;
  }
  public get nickname(): string | null {
    return this.member?.nick ?? null;
  }
  public get highestRole(): string | null {
    const id = this.member?.roles.at(-1);
    return id ? `<@&${id}>` : null;
  }
  public get inServer(): boolean {
    return this.member !== null;
  }
  public get permissions(): string[] {
    return this.member?.permissions
      ? calculatePermissions(this.member.permissions.bitfield).map(pretty)
      : [];
  }
  public get badges(): string[] {
    return this.user.publicFlags ? [String(this.user.publicFlags)] : [];
  }
  public roles(limit = 50): string[] {
    return (
      this.member?.roles
        .slice(-limit)
        .reverse()
        .map((id) => `<@&${id}>`) ?? []
    );
  }
  public avatar(format: ImageFormat = "png"): string {
    return (
      (this.member?.avatar
        ? memberAvatarUrl(this.member.guildId, this.user.id, {
            avatar: this.member.avatar,
            format,
            size: 4096,
          })
        : avatarUrl(this.user.id, this.user.discriminator, {
            avatar: this.user.avatar,
            format,
            size: 4096,
          })) ?? ""
    );
  }
  public banner(format: ImageFormat = "png"): string | null {
    return this.user.banner
      ? (bannerUrl(this.user.id, {
          banner: this.user.banner,
          format,
          size: 4096,
        }) ?? null)
      : null;
  }
  public accent(source: "avatar" | "banner" = "avatar"): Promise<string> {
    return dominant(
      source === "banner" ? (this.banner() ?? this.avatar()) : this.avatar(),
    );
  }
}
function pretty(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
