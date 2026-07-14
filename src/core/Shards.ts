import { ShardingManager, type ShardingManagerOptions } from "discord.js";

export interface ShardOptions extends Omit<ShardingManagerOptions, "token"> {
  token: string;
  file: string;
}

export class Shards {
  public readonly manager: ShardingManager;
  public constructor(options: ShardOptions) {
    this.manager = new ShardingManager(options.file, { ...options, token: options.token });
  }
  public start(): Promise<unknown> { return this.manager.spawn(); }
  public async stop(): Promise<void> { for (const shard of this.manager.shards.values()) await shard.kill(); }
  public send(message: unknown): Promise<unknown[]> { return this.manager.broadcastEval((client, context) => client.emit("kyroMessage", context), { context: message }); }
}
