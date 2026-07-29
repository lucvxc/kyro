import type { Manager } from "moonlink.js";
import type { ShardSocketRequest } from "discordeno";
import type { DiscordRuntime } from "../../core/Discord.ts";
type Packet = Parameters<Manager["packetUpdate"]>[0];
export class DiscordConnector {
  public manager!: Manager;
  #runtime?: DiscordRuntime;
  #offRaw?: () => void;
  public setManager(manager: Manager): void {
    this.manager = manager;
  }
  public listen(runtime: DiscordRuntime): void {
    this.#runtime = runtime;
    this.#offRaw = runtime.on("raw", this.#packet as never);
    if (runtime.isReady) void this.manager.init(String(runtime.bot.id));
    else
      runtime.once(
        "ready",
        () => void this.manager.init(String(runtime.bot.id)),
      );
  }
  public send(guildID: string, payload: ShardSocketRequest): void {
    if (!this.#runtime) return;
    const shard = this.#runtime.bot.gateway.calculateShardId(guildID);
    void this.#runtime.bot.gateway.sendPayload(shard, payload);
  }
  public stop(): void {
    this.#offRaw?.();
    this.#offRaw = undefined;
    this.#runtime = undefined;
  }
  readonly #packet = (packet: Packet): void => {
    void this.manager.packetUpdate(packet);
  };
}
