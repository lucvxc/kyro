import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { Client, Events } from "discord.js";

import { Loader } from "../src/events/Loader.ts";

const state = globalThis as typeof globalThis & { __kyroEvents?: string[] };
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("event Loader", () => {
  test("loads and unloads event files", async () => {
    const client = new Client({ intents: [] });
    const directory = resolve(import.meta.dir, "fixtures", "events");
    const loader = new Loader(client, directory);
    const listeners = client.listenerCount(Events.ClientReady);

    await loader.load();
    expect(client.listenerCount(Events.ClientReady)).toBe(listeners + 1);

    loader.unload();
    expect(client.listenerCount(Events.ClientReady)).toBe(listeners);
  });

  test("supports priority, filters, filtered once, and error handlers", async () => {
    state.__kyroEvents = [];

    const client = new Client({ intents: [] });
    const directory = resolve(import.meta.dir, "fixtures", "events");
    const loader = new Loader(client, directory);

    await loader.load();

    client.emit(Events.Debug, "skip");
    await flush();
    expect(state.__kyroEvents).toEqual([]);

    client.emit(Events.Debug, "run");
    await flush();
    expect(state.__kyroEvents).toEqual(["high", "low"]);

    client.emit(Events.Debug, "run");
    await flush();
    expect(state.__kyroEvents).toEqual(["high", "low", "low"]);

    client.emit(Events.Warn, "run");
    await flush();
    expect(state.__kyroEvents).toEqual(["high", "low", "low", "caught"]);

    loader.unload();
  });
});
