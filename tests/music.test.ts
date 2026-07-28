import { describe, expect, test } from "bun:test";
import type { Client } from "discord.js";
import type { Player as MoonPlayer, Track as MoonTrack } from "moonlink.js";

import { Music, Player } from "../index.ts";
import { track } from "../src/plugins/music/Player.ts";

describe("NodeLink music", () => {
  test("rejects invalid node ports clearly", () => {
    expect(
      () =>
        new Music({} as Client, {
          nodes: [
            { host: "node.example.com", password: "secret", port: Number.NaN },
          ],
        }),
    ).toThrow("A NodeLink node port must be between 1 and 65535.");
  });

  test("normalizes Moonlink tracks for Kyro commands", () => {
    expect(track(moonTrack("Die For You"))).toMatchObject({
      encoded: "Die For You",
      info: {
        title: "Die For You",
        author: "The Weeknd",
        length: 180_000,
        sourceName: "youtube",
      },
    });
  });

  test("exposes clean controls over the Moonlink player", async () => {
    const calls: string[] = [];
    const raw = {
      guildId: "guild",
      voiceChannelId: "voice",
      current: moonTrack("First"),
      queue: {
        all: [moonTrack("Second")],
        shuffle: () => calls.push("shuffle"),
      },
      previous: [],
      loop: "off",
      paused: false,
      volume: 100,
      connected: true,
      ping: 20,
      lastPosition: 1_000,
      setLoop() {
        calls.push("loop");
        return this;
      },
      pause: async () => {
        calls.push("pause");
      },
      resume: async () => {
        calls.push("resume");
      },
      setVolume: () => {
        calls.push("volume");
      },
      seek: async () => {
        calls.push("seek");
      },
      shuffle: () => calls.push("shuffle"),
      destroy: async () => {
        calls.push("destroy");
      },
    } as unknown as MoonPlayer;
    const player = new Player(raw);

    await player.pause();
    await player.pause(false);
    await player.setVolume(75);
    await player.seek(30_000);
    player.shuffle();
    player.loop = "queue";
    await player.destroy();

    expect(player.current?.info.title).toBe("First");
    expect(player.queue[0]?.info.title).toBe("Second");
    expect(calls).toEqual([
      "pause",
      "resume",
      "volume",
      "seek",
      "shuffle",
      "loop",
      "destroy",
    ]);
  });
});

function moonTrack(title: string): MoonTrack {
  return {
    encoded: title,
    title,
    author: "The Weeknd",
    duration: 180_000,
    identifier: title,
    isSeekable: true,
    isStream: false,
    uri: `https://example.com/${title}`,
    artworkUrl: null,
    sourceName: "youtube",
    position: 0,
    requester: "user",
    pluginInfo: {},
    userData: {},
  } as MoonTrack;
}
