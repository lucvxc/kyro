import { describe, expect, test } from "bun:test";
import { ApplicationCommandOptionType, InteractionContextType } from "discord.js";

import { compileSlash } from "../src/commands/Compiler.ts";
import { Registry } from "../src/commands/Registry.ts";

const run = (): void => undefined;

describe("Registry", () => {
  test("builds a visible catalog without hidden framework commands", () => {
    const registry = new Registry()
      .add({ name: "ping", description: "Ping", category: "utility", run })
      .add({ name: "kyro reload", description: "Reload", meta: { help: false }, run });

    expect(registry.catalog.visible.commands.map(command => command.name)).toEqual(["ping"]);
    expect(registry.catalog.visible.categories[0]?.roots).toEqual(["ping"]);
  });

  test("normalizes and matches hybrid command paths", () => {
    const registry = new Registry().add({
      name: "LastFM   Account",
      description: "View an account",
      type: "hybrid",
      run,
    });

    expect(registry.get("lastfm account", "slash")?.name).toBe("lastfm account");
    expect(registry.get("LASTFM ACCOUNT", "message")?.name).toBe("lastfm account");
  });

  test("returns remaining message arguments and preserves quoted values", () => {
    const registry = new Registry().add({
      name: "lastfm account",
      description: "View an account",
      type: "hybrid",
      run,
    });

    const match = registry.match('lastfm account set "Example User"');
    expect(match?.command.name).toBe("lastfm account");
    expect(match?.args).toEqual(["set", "Example User"]);
  });

  test("matches aliases only for message commands", () => {
    const registry = new Registry().add({
      name: "lastfm account",
      description: "View an account",
      type: "hybrid",
      aliases: ["lfm account", "lastfm acc"],
      run,
    });

    expect(registry.get("lfm account", "message")?.name).toBe("lastfm account");
    expect(registry.get("lfm account", "slash")).toBeUndefined();
    expect(registry.subs("lfm").map(command => command.name)).toEqual(["lastfm account"]);
  });

  test("rejects duplicate command paths", () => {
    const registry = new Registry().add({
      name: "ping",
      description: "Ping",
      run,
    });

    expect(() =>
      registry.add({ name: "PING", description: "Another ping", run }),
    ).toThrow('The command name or alias "ping" is already registered.');
  });
});

describe("compileSlash", () => {
  test("turns a spaced command name into a slash subcommand", () => {
    const registry = new Registry().add({
      name: "lastfm account",
      description: "View an account",
      type: "hybrid",
      args: {
        user: {
          type: "user",
          description: "The account owner",
          required: true,
        },
      },
      run,
    });

    const [command] = compileSlash(registry.values());
    expect(command?.name).toBe("lastfm");
    expect(command?.options?.[0]).toMatchObject({
      type: ApplicationCommandOptionType.Subcommand,
      name: "account",
      description: "View an account",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "The account owner",
          required: true,
        },
      ],
    });
  });

  test("adds options to a direct slash command", () => {
    const registry = new Registry().add({
      name: "say",
      description: "Send a message",
      args: {
        text: { type: "string", required: true },
      },
      run,
    });

    const [command] = compileSlash(registry.values());
    expect(command?.options?.[0]).toMatchObject({
      type: ApplicationCommandOptionType.String,
      name: "text",
      required: true,
    });
  });

  test("registers DM-only slash contexts", () => {
    const registry = new Registry().add({
      name: "inbox",
      description: "View your inbox",
      context: "dms",
      run,
    });

    const [command] = compileSlash(registry.values());
    expect(command?.contexts).toEqual([
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ]);
  });

  test("rejects a slash command that is also a subcommand parent", () => {
    const registry = new Registry()
      .add({ name: "lastfm", description: "Last.fm", run })
      .add({ name: "lastfm account", description: "View an account", run });

    expect(() => compileSlash(registry.values())).toThrow(
      'Slash command "lastfm" cannot be both a command and a parent of subcommands.',
    );
  });
});
