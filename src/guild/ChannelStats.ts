import { ChannelTypes, snowflakeToTimestamp, type Channel } from "discordeno";
export class ChannelStats {
  public constructor(private readonly channel: Channel) {}
  public get id(): string {
    return String(this.channel.id);
  }
  public get name(): string {
    return this.channel.name ?? "channel";
  }
  public get type(): string {
    return ChannelTypes[this.channel.type] ?? String(this.channel.type);
  }
  public get topic(): string | null {
    return this.channel.topic ?? null;
  }
  public get parent(): string | null {
    return this.channel.parentId ? `<#${this.channel.parentId}>` : null;
  }
  public get position(): number {
    return this.channel.position ?? 0;
  }
  public get created(): number {
    return Math.floor(snowflakeToTimestamp(this.channel.id) / 1_000);
  }
}
