import { Events, type Client, type Guild } from "discord.js";
import type { Manager } from "moonlink.js";

type Packet = Parameters<Manager["packetUpdate"]>[0];
type Payload = Parameters<Guild["shard"]["send"]>[0];

export class DiscordConnector {
  public manager!: Manager;
  #client?: Client;

  public setManager(manager: Manager): void {
    this.manager = manager;
  }

  public listen(client: Client): void {
    this.#client = client;
    client.once(Events.ClientReady, this.#ready);
    client.on(Events.Raw, this.#packet);
  }

  public send(guildID: string, payload: Payload): void {
    this.#client?.guilds.cache.get(guildID)?.shard.send(payload);
  }

  public stop(): void {
    this.#client?.off(Events.ClientReady, this.#ready);
    this.#client?.off(Events.Raw, this.#packet);
    this.#client = undefined;
  }

  readonly #ready = (client: Client<true>): void => {
    void this.manager.init(client.user.id);
  };

  readonly #packet = (packet: Packet): void => {
    void this.manager.packetUpdate(packet);
  };
}
