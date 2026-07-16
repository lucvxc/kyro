import type { ImageExtension, Role } from "discord.js";
import { dominant } from "../ui/Image.ts";

export class RoleStats {
  public constructor(private readonly role: Role) {}

  public get id(): string { return this.role.id; }
  public get name(): string { return this.role.name; }
  public get mention(): string { return this.role.toString(); }
  public get members(): number { return this.role.members.size; }
  public get permissions(): number { return this.role.permissions.toArray().length; }
  public get position(): number { return this.role.position; }
  public get color(): string { return this.role.hexColor; }
  public get mentionable(): boolean { return this.role.mentionable; }
  public get hoisted(): boolean { return this.role.hoist; }
  public get managed(): boolean { return this.role.managed; }
  public get created(): number { return Math.floor(this.role.createdTimestamp / 1_000); }
  public icon(extension: ImageExtension = "png"): string | null { return this.role.iconURL({ size: 4096, extension }); }
  public accent(): Promise<string> { const icon = this.icon(); return icon ? dominant(icon, this.baseColor) : Promise.resolve(this.baseColor); }
  private get baseColor(): string { return this.color === "#000000" ? "#5865F2" : this.color; }
}
