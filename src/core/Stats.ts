import { promises as fs } from "node:fs";
import path from "node:path";
import type { Client, ClientUser, ImageExtension } from "discord.js";
import { dominant } from "../ui/Image.ts";

const lineCache = new Map<string, number>();

export class Stats {
  public constructor(private readonly client: Client) {}
  public get bot(): ClientUser { if (!this.client.user) throw new Error("The bot is not ready."); return this.client.user; }
  public get id(): string { return this.bot.id; }
  public get name(): string { return this.bot.username; }
  public avatar(size: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 = 512, extension: ImageExtension = "png"): string {
    return this.bot.displayAvatarURL({ size, extension });
  }
  public accent(): Promise<string> { return dominant(this.avatar()); }
  public get servers(): number { return this.client.guilds.cache.size; }
  public get users(): number { return this.client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0); }
  public get ping(): number { return Math.max(0, Math.round(this.client.ws.ping)); }
  public get memory(): number { return Math.round(process.memoryUsage().rss / 1_048_576); }
  public get since(): number { return Math.floor((this.client.readyTimestamp ?? Date.now()) / 1_000); }
  public get uptime(): number { return this.client.uptime ?? 0; }
  public async lines(root = process.cwd()): Promise<number> {
    const cached = lineCache.get(root);
    if (cached !== undefined) return cached;

    const ignored = new Set(["node_modules", "drizzle", ".git", "dist", "out", "build"]);
    let total = 0;

    async function walk(directory: string): Promise<void> {
      const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
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
