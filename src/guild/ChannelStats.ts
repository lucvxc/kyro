import { ChannelType, type GuildBasedChannel } from "discord.js";

export class ChannelStats {
  public constructor(private readonly channel: GuildBasedChannel) {}

  public get id(): string { return this.channel.id; }
  public get name(): string { return this.channel.name; }
  public get type(): string { return ChannelType[this.channel.type].replace(/^Guild/, ""); }
  public get topic(): string | null { return "topic" in this.channel ? this.channel.topic : null; }
  public get parent(): string | null { return "parent" in this.channel ? this.channel.parent?.toString() ?? null : null; }
  public get position(): number { return "position" in this.channel ? this.channel.position : 0; }
  public get created(): number { return Math.floor((this.channel.createdTimestamp ?? Date.now()) / 1_000); }
}
