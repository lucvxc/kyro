import { EventEmitter } from "node:events";
import type { VoiceState } from "discordeno";
import { Manager, type Track as MoonTrack } from "moonlink.js";

import type { Context } from "../../commands/Context.ts";
import { UserError } from "../../commands/Errors.ts";
import { log } from "../../core/Log.ts";
import { runtimeStats, type DiscordRuntime } from "../../core/Discord.ts";
import { DiscordConnector } from "./Connector.ts";
import { Player, track } from "./Player.ts";
import { Search } from "./Search.ts";
import type {
  AddedTracks,
  Loop,
  MusicEvents,
  MusicOptions,
  Track,
} from "./Types.ts";

export class Music extends EventEmitter<MusicEvents> {
  public readonly manager: Manager;
  readonly #runtime: DiscordRuntime;
  readonly #search: Search;
  readonly #connector = new DiscordConnector();
  readonly #leaveOnEmpty: boolean;
  readonly #emptyTimeout: number;
  readonly #players = new Map<string, Player>();
  readonly #empty = new Map<string, ReturnType<typeof setTimeout>>();
  readonly #voiceStates = new Map<string, VoiceState>();
  #offVoice?: () => void;
  #started = false;

  public constructor(runtime: DiscordRuntime, options: MusicOptions) {
    super();
    if (!options.nodes?.length)
      throw new TypeError("NodeLink requires at least one node.");

    this.#runtime = runtime;
    this.#leaveOnEmpty = options.leaveOnEmpty ?? true;
    this.#emptyTimeout = options.emptyTimeout ?? 60_000;
    if (
      options.resumeTimeout !== undefined &&
      (!Number.isFinite(options.resumeTimeout) || options.resumeTimeout < 0)
    )
      throw new TypeError("Music resume timeout cannot be negative.");
    if (
      options.reconnectDelay !== undefined &&
      (!Number.isFinite(options.reconnectDelay) || options.reconnectDelay < 0)
    )
      throw new TypeError("Music reconnect delay cannot be negative.");
    this.manager = new Manager({
      nodes: options.nodes.map((node) => {
        const secure = node.secure ?? true;
        const port = node.port ?? (secure ? 443 : 2333);
        if (!node.host?.trim())
          throw new TypeError("A NodeLink node requires a host.");
        if (!node.password)
          throw new TypeError("A NodeLink node requires a password.");
        if (!Number.isInteger(port) || port < 1 || port > 65_535)
          throw new TypeError(
            "A NodeLink node port must be between 1 and 65535.",
          );
        return {
          host: node.host,
          password: node.password,
          port,
          secure,
          identifier: node.name,
        };
      }),
      options: {
        clientName: "Kyro/0.1.0",
        ...(options.resumeTimeout === undefined
          ? {}
          : { resume: true, resumeTimeout: options.resumeTimeout }),
        ...(options.reconnectDelay === undefined
          ? {}
          : { voiceConnection: { reconnectDelay: options.reconnectDelay } }),
      },
    });
    this.#search = new Search(this.manager, options.search);

    this.#events();
  }

  public get players(): ReadonlyMap<string, Player> {
    return this.#players;
  }
  public get nodes(): readonly unknown[] {
    return this.manager.readyNodes;
  }
  public voiceChannel(guildId: bigint, userId: bigint): string | undefined {
    return (
      this.#voiceStates.get(`${guildId}:${userId}`) ??
      runtimeStats(this.#runtime.bot).voiceStates.get(guildId)?.get(userId)
    )?.channelId?.toString();
  }

  public start(): void {
    if (this.#started) return;
    this.#started = true;
    this.manager.use(this.#connector, this.#runtime);
    this.#offVoice = this.#runtime.on("voiceStateUpdate", this.#voiceState);
  }

  public async stop(): Promise<void> {
    if (!this.#started) return;
    this.#started = false;
    this.#connector.stop();
    this.#offVoice?.();
    this.#offVoice = undefined;
    for (const timeout of this.#empty.values()) clearTimeout(timeout);
    this.#empty.clear();
    await this.manager.players.destroyAll();
    for (const node of this.manager.nodes.nodes.values()) await node.destroy();
    this.#players.clear();
  }

  public context(ctx: Context): MusicContext {
    return new MusicContext(this, ctx);
  }

  public get(guildID: string): Player | undefined {
    const raw = this.manager.players.get(guildID);
    if (!raw) {
      this.#players.delete(guildID);
      return undefined;
    }
    let player = this.#players.get(guildID);
    if (!player || player.raw !== raw) {
      player = new Player(raw);
      this.#players.set(guildID, player);
    }
    return player;
  }

  public async play(
    guild: bigint,
    channelID: string,
    textChannelID: string,
    query: string,
    requester?: string,
  ): Promise<AddedTracks> {
    if (!this.manager.hasReadyNodes)
      throw new UserError(
        "The music server is still connecting. Try again in a moment.",
      );
    const result = await this.#search.find(query, requester);
    if (!result)
      throw new UserError("I could not find anything for that search.");
    const found =
      result.loadType === "playlist"
        ? result.tracks
        : result.tracks.slice(0, 1);
    const tracks: MoonTrack[] = [];
    for (const value of found) {
      const playable = await this.#search.playable(value, requester);
      if (playable) tracks.push(playable);
    }
    if (!tracks.length)
      throw new UserError("I could not find a playable version of that track.");

    const guildID = String(guild);
    let raw = this.manager.players.get(guildID);
    if (!raw) {
      try {
        raw = this.manager.players.create({
          guildId: guildID,
          voiceChannelId: channelID,
          textChannelId: textChannelID,
        });
      } catch {
        throw new UserError("The music server is currently unavailable.");
      }
    } else if (raw.voiceChannelId !== channelID) {
      await raw.disconnect();
      raw.setVoiceChannelId(channelID).setTextChannelId(textChannelID);
    }

    await raw.connect().catch(() => {
      throw new UserError(
        "I could not connect NodeLink to that voice channel.",
      );
    });
    const wasPlaying = raw.playing || Boolean(raw.current);
    raw.queue.add(tracks);
    if (!wasPlaying) {
      const started = this.#trackStart(guildID);
      const playing = await raw.play();
      if (!playing) {
        void started.catch(() => undefined);
        throw new UserError(
          "NodeLink rejected the playback request. Check the NodeLink logs for the voice or decoder error.",
        );
      }
      try {
        await started;
      } catch {
        await this.destroy(guildID);
        throw new UserError(
          "NodeLink accepted the song but never started its audio stream. Check its UDP access, cipher service, and logs.",
        );
      }
    }
    this.get(guildID);

    return {
      tracks: tracks.map(track),
      playlist: result.playlistInfo?.name,
      started: !wasPlaying,
    };
  }

  public async skip(guildID: string): Promise<Track | null> {
    const player = this.manager.players.get(guildID);
    if (!player) return null;
    await player.skip();
    return player.current ? track(player.current) : null;
  }

  public async destroy(guildID: string): Promise<void> {
    const timeout = this.#empty.get(guildID);
    if (timeout) clearTimeout(timeout);
    this.#empty.delete(guildID);
    this.#players.delete(guildID);
    await this.manager.players.destroy(guildID, "Kyro stopped the player.");
  }

  readonly #voiceState = (state: VoiceState): void => {
    const key = `${state.guildId}:${state.userId}`;
    if (state.channelId) this.#voiceStates.set(key, state);
    else this.#voiceStates.delete(key);
    if (!this.#leaveOnEmpty) return;
    const guildID = String(state.guildId);
    const player = this.manager.players.get(guildID);
    if (!player) return;
    const occupied = [...this.#voiceStates.values()].some(
      (voice) =>
        voice.guildId === state.guildId &&
        String(voice.channelId) === player.voiceChannelId &&
        voice.userId !== this.#runtime.bot.id,
    );
    if (occupied) {
      const timeout = this.#empty.get(guildID);
      if (timeout) clearTimeout(timeout);
      this.#empty.delete(guildID);
      return;
    }
    this.#schedule(guildID);
  };

  #schedule(guildID: string): void {
    if (this.#empty.has(guildID)) return;
    this.#empty.set(
      guildID,
      setTimeout(() => {
        this.#empty.delete(guildID);
        void this.destroy(guildID);
      }, this.#emptyTimeout),
    );
  }

  #trackStart(guildID: string, timeout = 15_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = (id: string): void => {
        if (id !== guildID) return;
        clearTimeout(timer);
        this.off("trackStart", start);
        resolve();
      };
      const timer = setTimeout(() => {
        this.off("trackStart", start);
        reject(new Error("Track start timed out."));
      }, timeout);
      this.on("trackStart", start);
    });
  }

  #events(): void {
    this.manager.on("nodeReady", (node) => {
      log.info(`NodeLink "${node.identifier}" connected.`);
      this.emit("ready", node.identifier);
    });
    this.manager.on("nodeError", (node, error) =>
      log.error(`NodeLink "${node.identifier}" failed.`, error),
    );
    this.manager.on("nodeDisconnect", (node, code, reason) =>
      log.warn(
        `NodeLink "${node.identifier}" disconnected (${code}${reason ? `: ${reason}` : ""}).`,
      ),
    );
    this.manager.on("trackStart", (player, value) =>
      this.emit("trackStart", player.guildId, track(value)),
    );
    this.manager.on("trackEnd", (player, value, reason) =>
      this.emit("trackEnd", player.guildId, track(value), reason),
    );
    this.manager.on("trackException", (player, value, error) => {
      log.error(
        `Music player in guild "${player.guildId}" failed on "${value.title}".`,
        error,
      );
      this.emit("trackError", player.guildId, track(value), error);
    });
    this.manager.on("queueEnd", (player) => {
      this.emit("empty", player.guildId);
      this.#schedule(player.guildId);
    });
    this.manager.on("playerDestroy", (player) =>
      this.#players.delete(player.guildId),
    );
  }
}

export class MusicContext {
  public constructor(
    readonly manager: Music,
    readonly ctx: Context,
  ) {}

  public get player(): Player | undefined {
    return this.ctx.guildId
      ? this.manager.get(String(this.ctx.guildId))
      : undefined;
  }
  public get current(): Track | null {
    return this.player?.current ?? null;
  }
  public get queue(): readonly Track[] {
    return this.player?.queue ?? [];
  }
  public get playing(): boolean {
    return Boolean(this.player?.raw.playing);
  }
  public get paused(): boolean {
    return this.player?.paused ?? false;
  }
  public get position(): number {
    return this.player?.state.position ?? 0;
  }

  public async play(query: string): Promise<AddedTracks> {
    const { guild, channelId } = await this.#voice();
    return this.manager.play(
      guild,
      channelId,
      String(this.ctx.channelId),
      query,
      String(this.ctx.author.id),
    );
  }

  public async pause(): Promise<void> {
    await this.#control().pause(true);
  }
  public async resume(): Promise<void> {
    await this.#control().pause(false);
  }
  public async skip(): Promise<Track | null> {
    const player = this.#control();
    return this.manager.skip(player.guildID);
  }
  public async stop(): Promise<void> {
    const player = this.#control();
    await this.manager.destroy(player.guildID);
  }
  public async volume(value: number): Promise<void> {
    if (!Number.isFinite(value) || value < 0 || value > 200)
      throw new UserError("Volume must be between 0 and 200.");
    await this.#control().setVolume(Math.round(value));
  }
  public async seek(value: number | string): Promise<void> {
    const player = this.#control();
    const position = typeof value === "number" ? value : duration(value);
    if (
      position < 0 ||
      (player.current &&
        !player.current.info.isStream &&
        position > player.current.info.length)
    )
      throw new UserError("That position is outside the current track.");
    await player.seek(position);
  }
  public async shuffle(): Promise<void> {
    this.#control().shuffle();
  }
  public loop(mode: Loop): Loop {
    this.#control().loop = mode;
    return mode;
  }

  async #voice(): Promise<{ guild: bigint; channelId: string }> {
    const guild = this.ctx.guildId;
    if (!guild)
      throw new UserError("Music commands can only be used in a server.");
    const channelId = this.manager.voiceChannel(guild, this.ctx.author.id);
    if (!channelId) throw new UserError("Join a voice channel first.");
    return { guild, channelId };
  }

  #control(): Player {
    const guild = this.ctx.guildId;
    if (!guild)
      throw new UserError("Music commands can only be used in a server.");
    const player = this.manager.get(String(guild));
    if (!player) throw new UserError("Nothing is playing right now.");
    const channelID = this.manager.voiceChannel(guild, this.ctx.author.id);
    if (!channelID) throw new UserError("Join a voice channel first.");
    if (channelID !== player.channelID)
      throw new UserError("Join my voice channel first.");
    return player;
  }
}

function duration(value: string): number {
  if (/^\d+$/.test(value)) return Number(value) * 1_000;
  const parts = value.split(":").map(Number);
  if (
    !parts.length ||
    parts.some((part) => !Number.isFinite(part) || part < 0) ||
    parts.length > 3
  )
    throw new UserError("Use a time like `90`, `1:30`, or `1:02:30`.");
  return parts.reduce((total, part) => total * 60 + part, 0) * 1_000;
}
