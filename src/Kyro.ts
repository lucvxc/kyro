import { Client, GatewayIntentBits, Partials, type ClientOptions, type PresenceData } from "discord.js";

import type { Cmd } from "./commands/Cmd.ts";
import { Guard, type PermissionResolver } from "./commands/Guard.ts";
import { Loader as CmdLoader } from "./commands/Loader.ts";
import { Registrar } from "./commands/Registrar.ts";
import { Registry } from "./commands/Registry.ts";
import { Router, type CommandReplies, type ErrorHandler } from "./commands/Router.ts";
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
import type { PrefixResolver, AliasResolver } from "./commands/RouterTypes.ts";
import { version as versionCommand } from "./commands/Version.ts";
import { isDeviceStatus, status, type DeviceStatus } from "./core/Status.ts";
import { musicFor, type Music } from "./plugins/music/index.ts";

export interface PresenceConfig extends Omit<PresenceData, "status"> {
  status?: PresenceData["status"] | DeviceStatus;
}

export type ClientConfig = Omit<Partial<ClientOptions>, "presence" | "intents" | "partials"> & {
  token: string;
  appID: string;
  intents: ClientOptions["intents"];
  partials?: ClientOptions["partials"];
  shards?: ClientOptions["shards"];
  shardCount?: ClientOptions["shardCount"];
  presence?: PresenceConfig;
};

export interface KyroConfig {
  commands?: string;
  events?: string;
  components?: string;
  cooldown?: number;
  prefix?: string | PrefixResolver;
  resolveAlias?: AliasResolver;
  guildID?: string;
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
  resolveAlias?: AliasResolver;
  onError?: ErrorHandler;
  replies?: CommandReplies;
  permissions?: PermissionResolver;
  database?: DrizzleDB<any>;
}

export class Kyro {
  public readonly client: Client;
  public readonly commands: Registry;
  public readonly appID: string;
  public readonly prefix: string | PrefixResolver;
  public readonly db: DrizzleDB<any> | undefined;
  public readonly ownerIDs: readonly string[];
  public readonly version = "0.1.0";

  readonly #connection: Connection;
  #reload: (() => Promise<void>) | undefined;
  readonly #shutdown = (): void => { void this.stop().catch(error => log.error("Shutdown failed.", error)); };

  public constructor(options: Options) {
    const client = options.client ?? options;
    const config = options.config ?? options;

    if (!client.token?.trim()) {
      throw new TypeError("Kyro requires a Discord bot token.");
    }

    if (!client.appID?.trim()) {
      throw new TypeError("Kyro requires a Discord application ID.");
    }
    if (!client.intents) throw new TypeError("Kyro requires Discord gateway intents.");
    if (!/^\d{15,22}$/.test(client.appID)) throw new TypeError("Kyro requires a valid Discord application ID.");
    if (config.guildID !== undefined && !/^\d{15,22}$/.test(config.guildID)) throw new TypeError("Kyro requires a valid Discord guild ID.");
    if (config.sync === "guild" && !config.guildID) throw new TypeError('Kyro sync: "guild" requires guildID.');

    if (config.prefix !== undefined && !config.prefix) {
      throw new TypeError("Kyro's command prefix cannot be empty.");
    }

    if (config.cooldown !== undefined && (!Number.isFinite(config.cooldown) || config.cooldown < 0)) {
      throw new TypeError("Kyro's cooldown must be zero or a positive number of seconds.");
    }

    const token = client.token!;
    const appID = client.appID!;

    this.appID = appID;
    this.prefix = config.prefix ?? "!";
    this.db = options.database;
    this.ownerIDs = Object.freeze([...(config.ownerIDs ?? [])]);
    const clientOptions = { ...(client as Partial<ClientOptions>), intents: client.intents } as ClientOptions;
    delete (clientOptions as unknown as Record<string, unknown>).token;
    delete (clientOptions as unknown as Record<string, unknown>).appID;
    clientOptions.allowedMentions = {
      parse: [],
      repliedUser: false,
      ...client.allowedMentions,
    };
    if (client.partials !== undefined) clientOptions.partials = client.partials;
    if (client.shards !== undefined) clientOptions.shards = client.shards;
    if (client.shardCount !== undefined) clientOptions.shardCount = client.shardCount;
    if (client.presence !== undefined) {
      if (isDeviceStatus(client.presence.status)) {
        status(client.presence.status);
        const { status: _device, ...presence } = client.presence;
        clientOptions.presence = presence;
      } else {
        clientOptions.presence = client.presence as PresenceData;
      }
    }
    this.client = new Client(clientOptions);
    this.commands = new Registry();

    const router = new Router({
      client: this.client,
      registry: this.commands,
      prefix: this.prefix,
      resolveAlias: config.resolveAlias,
      guard: new Guard(config.cooldown, options.permissions),
      onError: options.onError,
      middleware: config.middleware,
      replies: options.replies,
    });

    const registrar = new Registrar({
      token,
      appID,
      guildID: config.sync === "guild" ? config.guildID : undefined,
    });
    const cmdLoader = config.commands
      ? new CmdLoader(this.commands, config.commands)
      : undefined;
    const evtLoader = config.events
      ? new EvtLoader(this.client, config.events, this)
      : undefined;
    const cmpLoader = config.components
      ? new CmpLoader(config.components)
      : undefined;
    const cmpRouter = cmpLoader ? new CmpRouter(this.client, cmpLoader, config.cooldown) : undefined;
    const pluginLoader = config.plugins?.length ? new PluginLoader(config.plugins) : undefined;

    this.#connection = new Connection({
      client: this.client,
      token,
      beforeStart: async () => {
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
        log.info(`Loaded ${this.commands.size} command${this.commands.size === 1 ? "" : "s"}.`);
        router.attach();
        cmpRouter?.attach();
      },
      afterStart: async () => {
        if (config.sync !== "none") await registrar.sync(this.commands);
        log.info(`Kyro is online (${config.sync === "guild" ? "guild" : config.sync === "none" ? "sync disabled" : "global"} commands).`);
      },
      beforeStop: async () => {
        router.detach();
        cmpRouter?.detach();
        evtLoader?.unload();
        await pluginLoader?.unload(this);
      },
      afterStop: async () => {
        await this.db?.close();
      },
    });
    this.#reload = async () => {
      if (!this.isReady) throw new Error("Kyro must be running before it can reload.");
      router.detach();
      cmpRouter?.detach();
      evtLoader?.unload();
      this.commands.reset();
      await cmdLoader?.reload();
      await evtLoader?.load();
      await cmpLoader?.reload();
      await pluginLoader?.reload(this);
      if (config.help === true && !this.commands.get("help", "message")) this.commands.add(help(this.commands));
      this.commands.add(reloadCommand(this));
      this.commands.add(versionCommand(this));
      this.commands.seal();
      router.attach();
      cmpRouter?.attach();
      if (config.sync !== "none") await registrar.sync(this.commands);
      log.info(`Reloaded ${this.commands.size} commands.`);
    };
    process.once("SIGINT", this.#shutdown);
    process.once("SIGTERM", this.#shutdown);
  }

  public get isReady(): boolean {
    return this.#connection.isReady;
  }

  public get music(): Music | undefined { return musicFor(this.client); }

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
    if (!this.#reload) return Promise.reject(new Error("Kyro is not initialized."));
    return this.#reload();
  }

  #validateIntents(): void {
    if (
      this.commands.hasGuildMessages &&
      !this.client.options.intents.has([
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ])
    ) {
      throw new Error(
        "Message and hybrid commands require the GuildMessages and MessageContent intents.",
      );
    }

    if (
      this.commands.hasDMs &&
      (!this.client.options.intents.has(GatewayIntentBits.DirectMessages) ||
        !this.client.options.partials?.includes(Partials.Channel))
    ) {
      throw new Error(
        "Message and hybrid DM commands require the DirectMessages intent and Channel partial.",
      );
    }
  }
}
