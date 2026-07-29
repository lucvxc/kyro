import {
  createGatewayManager,
  type CreateGatewayManagerOptions,
  type GatewayManager,
  type ShardSocketRequest,
} from "discordeno";

export type ShardOptions = CreateGatewayManagerOptions;
export class Shards {
  public readonly manager: GatewayManager;
  public constructor(options: ShardOptions) {
    this.manager = createGatewayManager(options);
  }
  public start(): Promise<void> {
    return this.manager.spawnShards();
  }
  public stop(): Promise<void> {
    return this.manager.shutdown(1_000, "Kyro shutting down");
  }
  public send(shardId: number, payload: ShardSocketRequest): Promise<void> {
    return this.manager.sendPayload(shardId, payload);
  }
}
