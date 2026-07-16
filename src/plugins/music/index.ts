import type { Client } from "discord.js";

import type { Kyro } from "../../Kyro.ts";
import { plugin, type Plugin } from "../Plugin.ts";
import { Music } from "./Music.ts";
import type { MusicOptions } from "./Types.ts";

const active = new WeakMap<Client, Music>();

export function nodelink(options: MusicOptions): Plugin {
  let music: Music | undefined;

  return plugin({
    name: "nodelink",
    version: "0.1.0",
    setup(kyro: Kyro) {
      music = new Music(kyro.client, options);
      active.set(kyro.client, music);
      music.start();
    },
    async stop(kyro: Kyro) {
      await music?.stop();
      active.delete(kyro.client);
      music = undefined;
    },
  });
}

export function musicFor(client: Client): Music | undefined {
  return active.get(client);
}

export { Music, MusicContext } from "./Music.ts";
export { Player } from "./Player.ts";
export { song, songLength } from "./Format.ts";
export type {
  AddedTracks,
  Loop,
  MusicEvents,
  MusicOptions,
  NodeOptions,
  PlayerState,
  Track,
  TrackInfo,
} from "./Types.ts";
