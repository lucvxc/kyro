import type { GuildEmoji, ImageExtension } from "discord.js";
import { dominant } from "../ui/Image.ts";

export class EmojiStats {
  public constructor(private readonly emoji: GuildEmoji) {}

  public get id(): string {
    return this.emoji.id;
  }
  public get name(): string {
    return this.emoji.name ?? "emoji";
  }
  public get animated(): boolean {
    return this.emoji.animated ?? false;
  }
  public get created(): number {
    return Math.floor(this.emoji.createdTimestamp / 1_000);
  }
  public image(extension: ImageExtension = "png"): string {
    return this.emoji.imageURL({ size: 4096, extension });
  }
  public accent(): Promise<string> {
    return dominant(this.image());
  }
}
