import type {
  CreateGatewayManagerOptions,
  CreateRestManagerOptions,
  GatewayIntents,
} from "discordeno";
import {
  DiscordRuntime,
  runtimeStats,
  type DiscordBot,
} from "./core/Discord.ts";

import type { Cmd } from "./commands/Cmd.ts";
import { Guard, type PermissionResolver } from "./commands/Guard.ts";
import { Loader as CmdLoader } from "./commands/Loader.ts";
import { Registrar } from "./commands/Registrar.ts";
import { Registry } from "./commands/Registry.ts";
import {
  Router,
  type CommandReplies,
  type ErrorHandler,
} from "./commands/Router.ts";
import { Connection } from "./core/Connection.ts";
import { Loader as EvtLoader } from "./events/Loader.ts";
import { Loader as CmpLoader } from "./components/Loader.ts";
import { Router as CmpRouter } from "./components/Router.ts";
import { log } from "./core/Log.ts";
import { help } from "./commands/Help.ts";
import type { DrizzleDB } from "./db/Drizzle.ts";
import { Loader as PluginLoader } from "./plugins/Loader.ts";
import type { Plugin } from "./plugins/Plugin.ts";
import { reload as reloadCommand } from "./commands/Reload.ts";
import type { Middleware } from "./commands/Middleware.ts";
import type { AliasLookup, PrefixResolver } from "./commands/RouterTypes.ts";
import { version as versionCommand } from "./commands/Version.ts";
import {
  deviceProperties,
  isDeviceStatus,
  presence,
  status,
  type PresenceConfig,
  type PresenceInput,
} from "./core/Status.ts";
import { musicFor, type Music } from "./plugins/music/index.ts";
import { Services, type ServiceToken } from "./core/Services.ts";
import type { Logger } from "./core/Logger.ts";
import { setLogger } from "./core/Log.ts";
import { FrameworkError, type FrameworkErrorHandler } from "./core/Errors.ts";
import { WorkTracker } from "./core/Work.ts";
import type { RateLimitPolicy } from "./core/RateLimit.ts";
import type { ComponentMiddleware } from "./components/Cmp.ts";
import { validateConfig } from "./core/Config.ts";
import type { HealthSnapshot } from "./core/Health.ts";
import type { SyncDiff, SyncLock } from "./commands/Registrar.ts";
import type { MessagePolicy } from "./ui/Message.ts";
import type { Instrumentation } from "./core/Instrumentation.ts";

export interface LifecycleHooks {
  beforeLoad?(kyro: Kyro): void | Promise<void>;
  afterLoad?(kyro: Kyro): void | Promise<void>;
  beforeStart?(kyro: Kyro): void | Promise<void>;
  afterStart?(kyro: Kyro): void | Promise<void>;
  beforeStop?(kyro: Kyro): void | Promise<void>;
  afterStop?(kyro: Kyro): void | Promise<void>;
  afterReload?(kyro: Kyro): void | Promise<void>;
}

export type ClientConfig = {
  token: string;
  appID: string;
  intents: GatewayIntents;
  gateway?: Omit<CreateGatewayManagerOptions, "token" | "intents">;
  rest?: Omit<CreateRestManagerOptions, "token">;
  presence?: PresenceConfig;
};

export interface KyroConfig {
  commands?: string;
  events?: string;
  components?: string;
  cooldown?: number;
  prefix?: string | PrefixResolver;
  getAlias?: AliasLookup;
  guildID?: string;
  guilds?: readonly string[];
  sync?: "global" | "guild" | "none";
  help?: boolean;
  plugins?: (string | Plugin)[];
  middleware?: Middleware[];
  ownerIDs?: string[];
}

export interface Options extends Partial<ClientConfig>, KyroConfig {
  client?: ClientConfig;
  config?: KyroConfig;
  commands?: string;
  events?: string;
  components?: string;
  cooldown?: number;
  prefix?: string | PrefixResolver;
  getAlias?: AliasLookup;
  onError?: ErrorHandler;
  replies?: CommandReplies;
  permissions?: PermissionResolver;
  database?: DrizzleDB<any>;
  onStop?: () => void | Promise<void>;
  hooks?: LifecycleHooks;
  services?: Iterable<readonly [ServiceToken, unknown]>;
  logger?: Logger;
  onFrameworkError?: FrameworkErrorHandler;
  componentMiddleware?: readonly ComponentMiddleware[];
  rateLimit?: RateLimitPolicy;
  autoDefer?: false | { after?: number; private?: boolean };
  timeout?: number;
  shutdownTimeout?: number;
  syncRetries?: number;
  syncLock?: SyncLock;
  messages?: MessagePolicy;
  groupMiddleware?: Readonly<Record<string, readonly Middleware[]>>;
  instrumentation?: Instrumentation;
}

export class Kyro {
  public readonly client: DiscordBot;
  public readonly commands: Registry;
  public readonly appID: string;
  public readonly prefix: string | PrefixResolver;
  public readonly db: DrizzleDB<any> | undefined;
  public readonly ownerIDs: readonly string[];
  public readonly version = "0.1.0";
  public readonly services: Services;
  public readonly signal: AbortSignal;

  readonly #connection: Connection;
  readonly #work = new WorkTracker();
  readonly #registrar: Registrar;
  readonly #evtLoader?: EvtLoader;
  readonly #cmpLoader?: CmpLoader;
  readonly #pluginLoader?: PluginLoader;
  readonly #onFrameworkError?: FrameworkErrorHandler;
  public readonly runtime: DiscordRuntime;
  #reload: (() => Promise<void>) | undefined;
  readonly #shutdown = (): void => {
    void this.stop().catch((error) => log.error("Shutdown failed.", error));
  };

  public constructor(options: Options) {
    validateConfig(options);
    setLogger(options.logger);
    const client = options.client ?? options;
    const config = options.config ?? options;

    if (!client.token?.trim()) {
      throw new TypeError("Kyro requires a Discord bot token.");
    }

    if (!client.appID?.trim()) {
      throw new TypeError("Kyro requires a Discord application ID.");
    }
    if (!client.intents)
      throw new TypeError("Kyro requires Discord gateway intents.");
    if (!/^\d{15,22}$/.test(client.appID))
      throw new TypeError("Kyro requires a valid Discord application ID.");
    if (config.guildID !== undefined && !/^\d{15,22}$/.test(config.guildID))
      throw new TypeError("Kyro requires a valid Discord guild ID.");
    for (const guild of config.guilds ?? [])
      if (!/^\d{15,22}$/.test(guild))
        throw new TypeError(`Kyro guild ID "${guild}" is invalid.`);
    if (config.sync === "guild" && !config.guildID)
      throw new TypeError('Kyro sync: "guild" requires guildID.');

    if (config.prefix !== undefined && !config.prefix) {
      throw new TypeError("Kyro's command prefix cannot be empty.");
    }

    if (
      config.cooldown !== undefined &&
      (!Number.isFinite(config.cooldown) || config.cooldown < 0)
    ) {
      throw new TypeError(
        "Kyro's cooldown must be zero or a positive number of seconds.",
      );
    }

    const token = client.token!;
    const appID = client.appID!;

    this.appID = appID;
    this.prefix = config.prefix ?? "!";
    this.db = options.database;
    this.ownerIDs = Object.freeze([...(config.ownerIDs ?? [])]);
    this.services = new Services(options.services);
    this.signal = this.#work.signal;
    this.#onFrameworkError = options.onFrameworkError;
    let makePresence = client.gateway?.makePresence;
    const presenceConfig = client.presence;
    if (presenceConfig !== undefined) {
      if (isDeviceStatus(presenceConfig.status)) {
        status(presenceConfig.status);
        const { status: _device, ...rest } = presenceConfig;
        makePresence = async () => presence(rest) as never;
      } else {
        makePresence = async () => presence(presenceConfig) as never;
      }
    }
    this.runtime = new DiscordRuntime({
      token,
      applicationId: BigInt(appID),
      intents: client.intents,
      gateway: {
        ...client.gateway,
        properties: deviceProperties() ?? client.gateway?.properties,
        makePresence,
      },
      rest: client.rest,
    });
    this.client = this.runtime.bot;
    this.commands = new Registry();

    const router = new Router({
      runtime: this.runtime,
      registry: this.commands,
      prefix: this.prefix,
      getAlias: config.getAlias,
      guard: new Guard(config.cooldown, options.permissions, options.rateLimit),
      onError: options.onError,
      middleware: config.middleware,
      replies: options.replies,
      services: this.services,
      work: this.#work,
      onFrameworkError: options.onFrameworkError,
      autoDefer: options.autoDefer,
      timeout: options.timeout,
      messagePolicy: options.messages,
      groupMiddleware: options.groupMiddleware,
      instrumentation: options.instrumentation,
    });

    const registrar = new Registrar({
      bot: this.client,
      appID,
      guildID: config.sync === "guild" ? config.guildID : undefined,
      guilds: config.guilds,
      retries: options.syncRetries,
      lock: options.syncLock,
    });
    this.#registrar = registrar;
    const cmdLoader = config.commands
      ? new CmdLoader(this.commands, config.commands)
      : undefined;
    const evtLoader = config.events
      ? new EvtLoader(this.runtime, config.events, this, {
          work: this.#work,
          onError: options.onFrameworkError,
          instrumentation: options.instrumentation,
        })
      : undefined;
    const cmpLoader = config.components
      ? new CmpLoader(config.components)
      : undefined;
    const cmpRouter = cmpLoader
      ? new CmpRouter({
          runtime: this.runtime,
          loader: cmpLoader,
          services: this.services,
          work: this.#work,
          cooldown: config.cooldown,
          middleware: options.componentMiddleware,
          onError: options.onFrameworkError,
          timeout: options.timeout,
          messagePolicy: options.messages,
          instrumentation: options.instrumentation,
        })
      : undefined;
    const pluginLoader = config.plugins?.length
      ? new PluginLoader(config.plugins, options.onFrameworkError)
      : undefined;
    this.#evtLoader = evtLoader;
    this.#cmpLoader = cmpLoader;
    this.#pluginLoader = pluginLoader;

    this.#connection = new Connection({
      runtime: this.runtime,
      beforeStart: async () => {
        await this.#hook("beforeLoad", options.hooks?.beforeLoad);
        if (this.db) log.info("Database connected.");
        await cmdLoader?.load();
        if (config.help === true && !this.commands.get("help", "message")) {
          this.commands.add(help(this.commands));
        }
        await evtLoader?.load();
        await cmpLoader?.load();
        await pluginLoader?.load(this);
        this.commands.add(reloadCommand(this));
        this.commands.add(versionCommand(this));
        this.#validateIntents();
        this.commands.seal();
        log.info(
          `Loaded ${this.commands.size} command${this.commands.size === 1 ? "" : "s"}.`,
        );
        router.attach();
        cmpRouter?.attach();
        await this.#hook("afterLoad", options.hooks?.afterLoad);
        await this.#hook("beforeStart", options.hooks?.beforeStart);
      },
      afterStart: async () => {
        if (config.sync !== "none") await this.#sync();
        const name =
          runtimeStats(this.client).user?.username ?? String(this.client.id);
        log.info(
          `${name} is online (${config.sync === "guild" ? "guild" : config.sync === "none" ? "sync disabled" : "global"} commands).`,
        );
        await this.#hook("afterStart", options.hooks?.afterStart);
      },
      beforeStop: async () => {
        await this.#hook("beforeStop", options.hooks?.beforeStop);
        await options.onStop?.();
        this.#work.stop();
        router.detach();
        cmpRouter?.detach();
        await this.#work.drain(options.shutdownTimeout ?? 10_000);
        evtLoader?.unload();
        await pluginLoader?.unload(this);
      },
      afterStop: async () => {
        await this.db?.close();
        await this.services.dispose();
        await this.#hook("afterStop", options.hooks?.afterStop);
      },
    });
    this.#reload = async () => {
      if (!this.isReady)
        throw new Error("Kyro must be running before it can reload.");
      router.detach();
      cmpRouter?.detach();
      evtLoader?.unload();
      this.commands.reset();
      await cmdLoader?.reload();
      await evtLoader?.load();
      await cmpLoader?.reload();
      await pluginLoader?.reload(this);
      if (config.help === true && !this.commands.get("help", "message"))
        this.commands.add(help(this.commands));
      this.commands.add(reloadCommand(this));
      this.commands.add(versionCommand(this));
      this.commands.seal();
      router.attach();
      cmpRouter?.attach();
      if (config.sync !== "none") await this.#sync();
      log.info(`Reloaded ${this.commands.size} commands.`);
      await this.#hook("afterReload", options.hooks?.afterReload);
    };
    process.once("SIGINT", this.#shutdown);
    process.once("SIGTERM", this.#shutdown);
  }

  public get isReady(): boolean {
    return this.#connection.isReady;
  }

  public get music(): Music | undefined {
    return musicFor(this.client);
  }

  public async setPresence(input: PresenceInput): Promise<void> {
    if (!this.isReady)
      throw new Error("Kyro must be running before setting a presence.");
    await this.client.gateway.editBotStatus(presence(input) as never);
  }

  public command(cmd: Cmd): this {
    this.commands.add(cmd);
    return this;
  }

  public start(): Promise<void> {
    return this.#connection.start();
  }

  public stop(): Promise<void> {
    process.off("SIGINT", this.#shutdown);
    process.off("SIGTERM", this.#shutdown);
    return this.#connection.stop();
  }

  public reload(): Promise<void> {
    if (!this.#reload)
      return Promise.reject(new Error("Kyro is not initialized."));
    return this.#reload();
  }

  public commandDiff(): Promise<SyncDiff[]> {
    return this.#registrar.diff(this.commands);
  }

  public syncCommands(): Promise<void> {
    return this.#sync();
  }

  public health(): HealthSnapshot {
    const stats = runtimeStats(this.client);
    return {
      ready: this.isReady,
      uptime: stats.startedAt ? Date.now() - stats.startedAt : 0,
      commands: this.commands.size,
      events: this.#evtLoader?.size ?? 0,
      components: this.#cmpLoader?.size ?? 0,
      plugins: this.#pluginLoader?.size ?? 0,
      activeHandlers: this.#work.size,
      guilds: stats.guilds.size,
      errors: log.errors,
      lastSync: this.#registrar.lastSync,
    };
  }

  async #hook(
    name: keyof LifecycleHooks,
    hook?: (kyro: Kyro) => void | Promise<void>,
  ): Promise<void> {
    if (!hook) return;
    try {
      await hook(this);
    } catch (cause) {
      const error = new FrameworkError({
        phase: "lifecycle",
        route: name,
        cause,
      });
      if (this.#onFrameworkError)
        await Promise.resolve(this.#onFrameworkError(error)).catch(
          () => undefined,
        );
      throw error;
    }
  }

  async #sync(): Promise<void> {
    try {
      await this.#registrar.sync(this.commands);
    } catch (cause) {
      const error = new FrameworkError({ phase: "sync", cause });
      if (this.#onFrameworkError)
        await Promise.resolve(this.#onFrameworkError(error)).catch(
          () => undefined,
        );
      throw error;
    }
  }

  #validateIntents(): void {
    if (
      this.commands.hasGuildMessages &&
      (Number(this.client.gateway.intents) & ((1 << 9) | (1 << 15))) !==
        ((1 << 9) | (1 << 15))
    ) {
      throw new Error(
        "Message and hybrid commands require the GuildMessages and MessageContent intents.",
      );
    }

    if (
      this.commands.hasDMs &&
      (Number(this.client.gateway.intents) & (1 << 12)) === 0
    ) {
      throw new Error(
        "Message and hybrid DM commands require the DirectMessages intent.",
      );
    }
  }
}
