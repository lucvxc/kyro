import {
  emojiUrl,
  snowflakeToTimestamp,
  type Emoji,
  type ImageFormat,
} from "discordeno";
import { dominant } from "../ui/Image.ts";
export class EmojiStats {
  public constructor(private readonly emoji: Emoji) {}
  public get id(): string {
    return String(this.emoji.id);
  }
  public get name(): string {
    return this.emoji.name ?? "emoji";
  }
  public get animated(): boolean {
    return this.emoji.animated ?? false;
  }
  public get created(): number {
    return this.emoji.id
      ? Math.floor(snowflakeToTimestamp(this.emoji.id) / 1_000)
      : 0;
  }
  public image(_extension: ImageFormat = "png"): string {
    if (!this.emoji.id)
      throw new Error("Unicode emoji do not have CDN images.");
    return emojiUrl(this.emoji.id, this.emoji.animated);
  }
  public accent(): Promise<string> {
    return dominant(this.image());
  }
}
