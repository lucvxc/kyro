import { promises as fs } from "node:fs";
import path from "node:path";
import { avatarUrl, type ImageFormat, type User } from "discordeno";
import type { DiscordBot } from "./Discord.ts";
import { runtimeStats } from "./Discord.ts";
import { dominant } from "../ui/Image.ts";
const lineCache = new Map<string, number>();
export class Stats {
  public constructor(private readonly client: DiscordBot) {}
  public get bot(): User {
    const user = runtimeStats(this.client).user;
    if (!user) throw new Error("The bot is not ready.");
    return user;
  }
  public get id(): string {
    return String(this.bot.id);
  }
  public get name(): string {
    return this.bot.username;
  }
  public avatar(
    size: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 = 512,
    format: ImageFormat = "png",
  ): string {
    return avatarUrl(this.bot.id, this.bot.discriminator, {
      avatar: this.bot.avatar,
      size,
      format,
    });
  }
  public accent(): Promise<string> {
    return dominant(this.avatar());
  }
  public get servers(): number {
    return runtimeStats(this.client).guilds.size;
  }
  public get serverIds(): string[] {
    return [...runtimeStats(this.client).guilds].map(String);
  }
  public get users(): number {
    return [...runtimeStats(this.client).guildMembers.values()].reduce(
      (total, count) => total + count,
      0,
    );
  }
  public get ping(): number {
    const values = [...this.client.gateway.shards.values()].flatMap((shard) =>
      shard.heart.rtt === undefined ? [] : [shard.heart.rtt],
    );
    return values.length
      ? Math.round(
          values.reduce((total, value) => total + value, 0) / values.length,
        )
      : 0;
  }
  public get memory(): number {
    return Math.round(process.memoryUsage().rss / 1_048_576);
  }
  public get since(): number {
    return Math.floor(
      (runtimeStats(this.client).startedAt ?? Date.now()) / 1_000,
    );
  }
  public get uptime(): number {
    return Date.now() - (runtimeStats(this.client).startedAt ?? Date.now());
  }
  public async lines(root = process.cwd()): Promise<number> {
    const cached = lineCache.get(root);
    if (cached !== undefined) return cached;
    const ignored = new Set([
      "node_modules",
      "drizzle",
      ".git",
      "dist",
      "out",
      "build",
    ]);
    let total = 0;
    async function walk(directory: string): Promise<void> {
      for (const entry of await fs
        .readdir(directory, { withFileTypes: true })
        .catch(() => [])) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory() && !ignored.has(entry.name)) await walk(target);
        else if (entry.isFile() && /\.(?:ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = await fs.readFile(target, "utf8").catch(() => "");
          if (content) total += content.split(/\r?\n/).length;
        }
      }
    }
    await walk(root);
    lineCache.set(root, total);
    return total;
  }
}
