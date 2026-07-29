import {
  calculatePermissions,
  roleIconUrl,
  snowflakeToTimestamp,
  type ImageFormat,
  type Role,
} from "discordeno";
import { dominant } from "../ui/Image.ts";
export class RoleStats {
  public constructor(
    private readonly role: Role,
    private readonly memberCount = 0,
  ) {}
  public get id(): string {
    return String(this.role.id);
  }
  public get name(): string {
    return this.role.name;
  }
  public get mention(): string {
    return `<@&${this.role.id}>`;
  }
  public get members(): number {
    return this.memberCount;
  }
  public get permissions(): number {
    return calculatePermissions(this.role.permissions.bitfield).length;
  }
  public get position(): number {
    return this.role.position;
  }
  public get color(): string {
    return `#${this.role.color.toString(16).padStart(6, "0")}`;
  }
  public get mentionable(): boolean {
    return this.role.mentionable;
  }
  public get hoisted(): boolean {
    return this.role.hoist;
  }
  public get managed(): boolean {
    return this.role.managed;
  }
  public get created(): number {
    return Math.floor(snowflakeToTimestamp(this.role.id) / 1_000);
  }
  public icon(_extension: ImageFormat = "png"): string | null {
    return this.role.icon
      ? (roleIconUrl(this.role.id, this.role.icon) ?? null)
      : null;
  }
  public accent(): Promise<string> {
    const icon = this.icon();
    return icon
      ? dominant(icon, this.baseColor)
      : Promise.resolve(this.baseColor);
  }
  private get baseColor(): string {
    return this.color === "#000000" ? "#5865F2" : this.color;
  }
}
