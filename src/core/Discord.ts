import {
  createBot,
  createDesiredPropertiesObject,
  type Bot,
  type CompleteDesiredProperties,
  type CreateGatewayManagerOptions,
  type CreateRestManagerOptions,
  type EventHandlers,
  type GatewayIntents,
  type Guild,
  type User,
  type VoiceState,
} from "discordeno";

type DesiredProperties = { guild: { presences: true } };
export type DiscordProperties = CompleteDesiredProperties<
  DesiredProperties,
  true
>;
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
  guildObjects: Map<bigint, Guild>;
  guildMembers: Map<bigint, number>;
  voiceStates: Map<bigint, Map<bigint, VoiceState>>;
  startedAt?: number;
}
const stats = new WeakMap<DiscordBot, RuntimeStats>();
export function runtimeStats(bot: DiscordBot): RuntimeStats {
  return (
    stats.get(bot) ?? {
      guilds: new Set(),
      guildObjects: new Map(),
      guildMembers: new Map(),
      voiceStates: new Map(),
    }
  );
}

export async function freshMemberCount(
  bot: DiscordBot,
  guildId: string | bigint,
): Promise<number> {
  const id = snowflake(guildId);
  const state = runtimeStats(bot);
  const live = await bot.rest.getGuild(id, { counts: true });
  const count =
    live.approximateMemberCount ??
    state.guildMembers.get(id) ??
    state.guildObjects.get(id)?.memberCount ??
    0;
  state.guildMembers.set(id, count);
  const guild = state.guildObjects.get(id);
  if (guild) guild.memberCount = count;
  return count;
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
              guildObjects: new Map(),
              guildMembers: new Map(),
              voiceStates: new Map(),
              startedAt: Date.now(),
            });
          } else if (name === "guildCreate") {
            const guild = args[0] as unknown as {
              id: bigint;
              memberCount?: number;
            };
            runtimeStats(this.bot).guilds.add(guild.id);
            runtimeStats(this.bot).guildObjects.set(guild.id, guild as Guild);
            runtimeStats(this.bot).guildMembers.set(
              guild.id,
              guild.memberCount ??
                (guild as { approximateMemberCount?: number })
                  .approximateMemberCount ??
                (guild as Guild).members?.size ??
                0,
            );
            runtimeStats(this.bot).voiceStates.set(
              guild.id,
              new Map(
                [...((guild as Guild).voiceStates?.values() ?? [])]
                  .filter((state) => state.channelId)
                  .map((state) => [state.userId, state]),
              ),
            );
          } else if (name === "guildDelete") {
            const guildId = args[0] as unknown as bigint;
            runtimeStats(this.bot).guilds.delete(guildId);
            runtimeStats(this.bot).guildObjects.delete(guildId);
            runtimeStats(this.bot).guildMembers.delete(guildId);
            runtimeStats(this.bot).voiceStates.delete(guildId);
          } else if (name === "guildUpdate") {
            const guild = args[0] as unknown as Guild;
            const current = runtimeStats(this.bot).guildObjects.get(guild.id);
            const snapshot = current ? assignDefined(current, guild) : guild;
            runtimeStats(this.bot).guildObjects.set(guild.id, snapshot);
            runtimeStats(this.bot).guildMembers.set(
              guild.id,
              snapshot.memberCount ?? snapshot.members?.size ?? 0,
            );
          } else if (name === "guildMemberAdd") {
            const member = args[0] as unknown as { guildId: bigint };
            changeMemberCount(this.bot, member.guildId, 1);
          } else if (name === "guildMemberRemove") {
            const guildId = args[1] as unknown as bigint;
            changeMemberCount(this.bot, guildId, -1);
          } else if (name === "presenceUpdate") {
            const presence = args[0] as unknown as {
              guildId: bigint;
              user: { id: bigint };
            };
            const guild = runtimeStats(this.bot).guildObjects.get(
              presence.guildId,
            );
            if (guild)
              guild.presences = [
                ...(guild.presences ?? []).filter(
                  (entry) => entry.user.id !== presence.user.id,
                ),
                presence as never,
              ];
          } else if (name === "channelCreate" || name === "channelUpdate") {
            const channel = args[0] as unknown as {
              id: bigint;
              guildId?: bigint;
            };
            if (channel.guildId)
              runtimeStats(this.bot)
                .guildObjects.get(channel.guildId)
                ?.channels.set(channel.id, channel as never);
          } else if (name === "channelDelete") {
            const channel = args[0] as unknown as {
              id: bigint;
              guildId?: bigint;
            };
            if (channel.guildId)
              runtimeStats(this.bot)
                .guildObjects.get(channel.guildId)
                ?.channels.delete(channel.id);
          } else if (name === "roleCreate" || name === "roleUpdate") {
            const role = args[0] as unknown as {
              id: bigint;
              guildId: bigint;
            };
            runtimeStats(this.bot)
              .guildObjects.get(role.guildId)
              ?.roles.set(role.id, role as never);
          } else if (name === "roleDelete") {
            const role = args[0] as unknown as {
              guildId: bigint;
              roleId: bigint;
            };
            runtimeStats(this.bot)
              .guildObjects.get(role.guildId)
              ?.roles.delete(role.roleId);
          } else if (name === "voiceStateUpdate") {
            const state = args[0] as unknown as VoiceState;
            const guild =
              runtimeStats(this.bot).voiceStates.get(state.guildId) ??
              new Map<bigint, VoiceState>();
            if (state.channelId) guild.set(state.userId, state);
            else guild.delete(state.userId);
            runtimeStats(this.bot).voiceStates.set(state.guildId, guild);
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
      transformers: {
        customizers: {
          user: (_bot, _payload, user) => {
            if (user.discriminator === "0")
              Object.defineProperty(user, "tag", {
                value: user.username,
                enumerable: true,
              });
            return user;
          },
          component: (bot, payload, component) => {
            const raw = payload as unknown as SubmittedComponent;
            if (raw.type === 18)
              return {
                type: raw.type,
                label: raw.label,
                description: raw.description,
                component: raw.component
                  ? bot.transformers.component(bot, raw.component as never)
                  : undefined,
              };
            if (!component) return component;
            return raw.values
              ? { ...component, values: raw.values }
              : component;
          },
        },
      },
      desiredProperties: createDesiredPropertiesObject(
        { guild: { presences: true } },
        true,
      ),
    });
    stats.set(this.bot, {
      guilds: new Set(),
      guildObjects: new Map(),
      guildMembers: new Map(),
      voiceStates: new Map(),
    });
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

function assignDefined<T extends object>(target: T, source: T): T {
  for (const [key, value] of Object.entries(source))
    if (value !== undefined) (target as Record<string, unknown>)[key] = value;
  return target;
}

function changeMemberCount(
  bot: DiscordBot,
  guildId: bigint,
  change: 1 | -1,
): void {
  const state = runtimeStats(bot);
  const guild = state.guildObjects.get(guildId);
  const current =
    state.guildMembers.get(guildId) ??
    guild?.memberCount ??
    guild?.members?.size ??
    0;
  const count = Math.max(0, current + change);
  state.guildMembers.set(guildId, count);
  if (guild) guild.memberCount = count;
}

interface SubmittedComponent {
  type: number;
  label?: string;
  description?: string;
  component?: SubmittedComponent;
  values?: (string | bigint)[];
}

export function snowflake(value: string | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export function snowflakeString(value: string | bigint): string {
  return String(value);
}
