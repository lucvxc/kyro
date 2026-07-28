import type { Player as MoonPlayer, Track as MoonTrack } from "moonlink.js";

import type { Loop, PlayerState, Track } from "./Types.ts";

export class Player {
  public constructor(public readonly raw: MoonPlayer) {}

  public get guildID(): string {
    return this.raw.guildId;
  }
  public get channelID(): string {
    return this.raw.voiceChannelId;
  }
  public get current(): Track | null {
    return this.raw.current ? track(this.raw.current) : null;
  }
  public get queue(): Track[] {
    return this.raw.queue.all.map(track);
  }
  public get history(): Track[] {
    return this.raw.previous.map(track);
  }
  public get loop(): Loop {
    return this.raw.loop as Loop;
  }
  public set loop(value: Loop) {
    this.raw.setLoop(value);
  }
  public get paused(): boolean {
    return this.raw.paused;
  }
  public get volume(): number {
    return this.raw.volume;
  }
  public get position(): number {
    const current = this.raw.current as (MoonTrack & { time?: number }) | null;
    if (!current) return 0;

    const updated =
      typeof current.time === "number"
        ? current.time
        : this.raw.lastPositionTime;
    let position = current.position ?? this.raw.lastPosition ?? 0;
    if (this.raw.playing && !this.raw.paused && Number.isFinite(updated))
      position += Date.now() - updated;

    if (current.isStream) return Math.max(0, position);
    return Math.max(0, Math.min(position, current.duration));
  }
  public get state(): PlayerState {
    return {
      time: Date.now(),
      position: this.position,
      connected: this.raw.connected,
      ping: this.raw.ping,
    };
  }

  public pause(value = true): Promise<unknown> {
    return value ? this.raw.pause() : this.raw.resume();
  }

  public async setVolume(value: number): Promise<void> {
    this.raw.setVolume(value);
  }
  public async seek(position: number): Promise<void> {
    await this.raw.seek(position);
    this.raw.lastPosition = position;
    this.raw.lastPositionTime = Date.now();
  }
  public shuffle(): void {
    this.raw.shuffle();
  }
  public async destroy(): Promise<void> {
    await this.raw.destroy("Kyro stopped the player.");
  }
}

export function track(value: MoonTrack): Track {
  return {
    encoded: value.encoded,
    info: {
      identifier: value.identifier,
      title: value.title,
      author: value.author,
      length: value.duration,
      isSeekable: value.isSeekable,
      isStream: value.isStream,
      position: value.position,
      uri: value.uri,
      artworkUrl: value.artworkUrl,
      sourceName: value.sourceName,
    },
    pluginInfo: value.pluginInfo,
    userData: value.userData,
    requester:
      typeof value.requester === "string" ? value.requester : undefined,
  };
}
