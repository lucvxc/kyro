import {
  createBot,
  createDesiredPropertiesObject,
  type Bot,
  type CompleteDesiredProperties,
  type CreateGatewayManagerOptions,
  type CreateRestManagerOptions,
  type EventHandlers,
  type GatewayIntents,
  type User,
} from "discordeno";

export type DiscordProperties = CompleteDesiredProperties<{}, true>;
export type DiscordBot = Bot<DiscordProperties>;
export type DiscordEvent = keyof EventHandlers<DiscordProperties, 0>;
export type DiscordEvents = EventHandlers<DiscordProperties, 0>;
export type DiscordListener<K extends DiscordEvent> = DiscordEvents[K];
export type DiscordInteraction = Parameters<
  DiscordEvents["interactionCreate"]
>[0];
export type DiscordMessage = Parameters<DiscordEvents["messageCreate"]>[0];

export interface DiscordOptions {
  token: string;
  applicationId: bigint;
  intents: GatewayIntents;
  gateway?: Omit<CreateGatewayManagerOptions, "token" | "intents">;
  rest?: Omit<CreateRestManagerOptions, "token">;
}

export interface RuntimeStats {
  user?: User;
  guilds: Set<bigint>;
  guildMembers: Map<bigint, number>;
  startedAt?: number;
}
const stats = new WeakMap<DiscordBot, RuntimeStats>();
export function runtimeStats(bot: DiscordBot): RuntimeStats {
  return stats.get(bot) ?? { guilds: new Set(), guildMembers: new Map() };
}

/**
 * Kyro's Discordeno runtime boundary. Discordeno intentionally exposes one
 * handler per gateway event; Kyro needs many independently reloadable routers,
 * plugins and user event files, so this class provides deterministic fan-out.
 */
export class DiscordRuntime {
  public readonly bot: DiscordBot;
  readonly #listeners = new Map<
    DiscordEvent,
    Set<(...args: never[]) => unknown>
  >();
  #ready = false;

  public constructor(options: DiscordOptions) {
    const events = new Proxy({} as Partial<DiscordEvents>, {
      get:
        (_target, name: string) =>
        (...args: unknown[]) => {
          if (name === "ready") {
            this.#ready = true;
            const ready = args[0] as unknown as {
              user: User;
              guilds: bigint[];
            };
            stats.set(this.bot, {
              user: ready.user,
              guilds: new Set(ready.guilds),
              guildMembers: new Map(),
              startedAt: Date.now(),
            });
          } else if (name === "guildCreate") {
            const guild = args[0] as unknown as {
              id: bigint;
              memberCount?: number;
            };
            runtimeStats(this.bot).guilds.add(guild.id);
            runtimeStats(this.bot).guildMembers.set(
              guild.id,
              guild.memberCount ?? 0,
            );
          } else if (name === "guildDelete") {
            const guildId = args[0] as unknown as bigint;
            runtimeStats(this.bot).guilds.delete(guildId);
            runtimeStats(this.bot).guildMembers.delete(guildId);
          }
          this.emit(name as DiscordEvent, ...(args as never[]));
        },
    });

    this.bot = createBot({
      token: options.token,
      applicationId: options.applicationId,
      intents: options.intents,
      gateway: options.gateway,
      rest: options.rest,
      events: events as Partial<EventHandlers<DiscordProperties, 0>>,
      desiredProperties: createDesiredPropertiesObject({}, true),
    });
    stats.set(this.bot, { guilds: new Set(), guildMembers: new Map() });
  }

  public get isReady(): boolean {
    return this.#ready;
  }

  public on<K extends DiscordEvent>(
    name: K,
    listener: DiscordListener<K>,
  ): () => void {
    const listeners = this.#listeners.get(name) ?? new Set();
    listeners.add(listener as (...args: never[]) => unknown);
    this.#listeners.set(name, listeners);
    return () => this.off(name, listener);
  }

  public once<K extends DiscordEvent>(
    name: K,
    listener: DiscordListener<K>,
  ): () => void {
    const remove = this.on(name, ((...args: never[]) => {
      remove();
      return (listener as (...values: never[]) => unknown)(...args);
    }) as DiscordListener<K>);
    return remove;
  }

  public off<K extends DiscordEvent>(
    name: K,
    listener: DiscordListener<K>,
  ): void {
    const listeners = this.#listeners.get(name);
    listeners?.delete(listener as (...args: never[]) => unknown);
    if (listeners?.size === 0) this.#listeners.delete(name);
  }

  public async start(): Promise<void> {
    const ready = this.#ready
      ? Promise.resolve()
      : new Promise<void>((resolve) => this.once("ready", () => resolve()));
    await this.bot.start();
    await ready;
  }

  public async stop(): Promise<void> {
    this.#ready = false;
    await this.bot.shutdown();
  }

  private emit(name: DiscordEvent, ...args: never[]): void {
    for (const listener of this.#listeners.get(name) ?? []) {
      try {
        const result = listener(...args);
        if (result instanceof Promise)
          void result.catch((error) => this.bot.logger.error(error));
      } catch (error) {
        this.bot.logger.error(error);
      }
    }
  }
}

export function snowflake(value: string | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export function snowflakeString(value: string | bigint): string {
  return String(value);
}
