import { describe, expect, test } from "bun:test";
import {
  ApplicationCommandOptionTypes,
  DiscordInteractionContextType,
  GatewayIntents,
  type CreateSlashApplicationCommand,
  type Guild,
} from "discordeno";
import { Registry } from "../src/commands/Registry.ts";
import { compileSlash } from "../src/commands/Compiler.ts";
import { container } from "../src/ui/Container.ts";
import { button, modal, select } from "../src/ui/Control.ts";
import { messageOptions } from "../src/ui/Message.ts";
import { Services } from "../src/core/Services.ts";
import { ComponentSigner } from "../src/components/SignedId.ts";
import { MemoryRateLimitAdapter } from "../src/core/RateLimit.ts";
import { createTestKyro } from "../src/testing/Harness.ts";
import { validateConfig, ConfigurationError } from "../src/core/Config.ts";
import { WorkTracker } from "../src/core/Work.ts";
import { Context } from "../src/commands/Context.ts";
import { ComponentContext } from "../src/components/Context.ts";
import {
  DiscordRuntime,
  runtimeStats,
  type DiscordInteraction,
} from "../src/core/Discord.ts";
import type { Entry } from "../src/commands/Cmd.ts";
import { Music } from "../src/plugins/music/Music.ts";

describe("Discordeno migration boundary", () => {
  test("initializes NodeLink once when plugins reload after ready", async () => {
    const runtime = {
      isReady: true,
      bot: { id: 1n },
      on: () => () => undefined,
      once: () => () => undefined,
    } as unknown as DiscordRuntime;
    const music = new Music(runtime, {
      nodes: [{ host: "node.example.com", password: "test" }],
    });
    let starts = 0;
    music.manager.init = (async () => {
      starts += 1;
      return music.manager;
    }) as typeof music.manager.init;

    music.start();
    await Promise.resolve();

    expect(starts).toBe(1);
    await music.stop();
  });

  test("compiles nested commands to Discord API payloads", () => {
    const registry = new Registry();
    registry.add({
      name: "admin ban",
      description: "Ban a user",
      context: "guild",
      args: { user: { type: "user", required: true } },
      run() {},
    });
    const [command] = compileSlash(registry.values());
    expect(command?.name).toBe("admin");
    expect(command?.contexts).toEqual([DiscordInteractionContextType.Guild]);
    expect(command?.integrationTypes).toBeUndefined();
    expect(
      (command as CreateSlashApplicationCommand | undefined)?.options?.[0]
        ?.type,
    ).toBe(ApplicationCommandOptionTypes.SubCommand);
  });

  test("routes aliases through the native registry", () => {
    const registry = new Registry();
    registry.add({
      name: "ping now",
      aliases: ["p"],
      description: "Ping",
      type: "message",
      run() {},
    });
    expect(registry.match("p extra")?.command.name).toBe("ping now");
  });

  test("builds components-v2 payloads", () => {
    const payload = messageOptions(
      container()
        .text("Hello")
        .row(button({ id: "ok", label: "OK" })),
    );
    expect(Number(payload.flags)).toBe(32_768);
    expect(payload.components).toHaveLength(1);
  });

  test("preserves native Discordeno message payloads", () => {
    const payload = messageOptions({
      content: "hello",
      files: [{ blob: new Blob(["file"]), name: "file.txt" }],
    });
    expect(payload.content).toBe("hello");
    expect(payload.files?.[0]?.name).toBe("file.txt");
  });

  test("keeps modal labels off nested text inputs", () => {
    const payload = modal({
      id: "profile",
      title: "Edit profile",
      inputs: [{ id: "name", label: "Name" }],
    });
    const field = payload.components?.[0] as unknown as {
      label: string;
      component: { label?: string };
    };
    expect(field.label).toBe("Name");
    expect(field.component.label).toBeUndefined();
  });

  test("preserves complete guild state across partial updates", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds,
    });
    const channels = new Map([
      [2n, { id: 2n }],
    ]) as unknown as Guild["channels"];
    const guild = { id: 1n, name: "Before", channels } as unknown as Guild;
    runtimeStats(runtime.bot).guildObjects.set(guild.id, guild);
    runtime.bot.events.guildUpdate?.({
      id: guild.id,
      name: "After",
    } as Guild);

    const command = {
      name: "guild",
      path: ["guild"],
      description: "Guild",
      type: "slash",
      aliases: [],
      context: "guild",
      permissions: [],
      botPermissions: [],
      guilds: [],
      category: "general",
      syntax: "guild",
      run() {},
    } as Entry;
    const interaction = {
      bot: runtime.bot,
      user: { id: 1n },
      guildId: guild.id,
      guild: { id: guild.id },
      channelId: 2n,
    } as unknown as DiscordInteraction;
    const ctx = new Context("slash", interaction, command);

    expect(ctx.guild?.name).toBe("After");
    expect(ctx.guild?.channels).toBe(channels);
  });

  test("rejects invalid component payloads before Discord", () => {
    expect(() => button({ id: "empty", label: "   " })).toThrow(
      "non-empty label or emoji",
    );
    expect(() =>
      select({
        id: "duplicate",
        options: [
          { label: "One", value: "same" },
          { label: "Two", value: "same" },
        ],
      }),
    ).toThrow("duplicated");
    expect(() =>
      container()
        .text("Duplicate controls")
        .row(button({ id: "same", label: "One" }))
        .row(button({ id: "same", label: "Two" }))
        .toJSON(),
    ).toThrow("duplicated");
  });

  test("rejects more slash roots than Discord allows", () => {
    const registry = new Registry();
    for (let index = 0; index < 101; index++)
      registry.add({
        name: `command${index}`,
        description: `Command ${index}`,
        run() {},
      });
    expect(() => compileSlash(registry.values())).toThrow(
      "at most 100 slash command roots",
    );
  });

  test("disposes services in reverse registration order", async () => {
    const order: number[] = [];
    const services = new Services([
      ["first", { dispose: () => order.push(1) }],
      ["second", { dispose: () => order.push(2) }],
    ]);
    await services.dispose();
    expect(order).toEqual([2, 1]);
  });

  test("signs component IDs and rejects tampering", () => {
    const signer = new ComponentSigner("a-production-secret");
    const signed = signer.sign("ticket:close:42");
    expect(signer.verify(signed)).toBe("ticket:close:42");
    expect(signer.verify(`${signed}x`)).toBeNull();
  });

  test("supports adapter-based rate limits", async () => {
    const adapter = new MemoryRateLimitAdapter();
    expect(await adapter.consume("user:1", 1, 10_000)).toBe(0);
    expect(await adapter.consume("user:1", 1, 10_000)).toBeGreaterThan(0);
  });

  test("runs commands without Discord through the testing harness", async () => {
    const harness = createTestKyro({
      name: "hello",
      description: "Say hello",
      run: (ctx) => ctx.reply(`Hello ${ctx.string("name")}`),
      args: { name: { type: "string" } },
    });
    const result = await harness.run("hello", { args: { name: "Kyro" } });
    expect(result.replies).toEqual(["Hello Kyro"]);
  });

  test("reports all invalid configuration fields together", () => {
    expect(() =>
      validateConfig({
        token: "",
        appID: "bad",
        intents: GatewayIntents.Guilds,
      }),
    ).toThrow(ConfigurationError);
  });

  test("tracks and drains active framework work", async () => {
    const tracker = new WorkTracker();
    let complete = false;
    void tracker.run(async () => {
      await Promise.resolve();
      complete = true;
    });
    tracker.stop();
    await tracker.drain();
    expect(complete).toBeTrue();
    expect(tracker.size).toBe(0);
  });

  test("edits the original interaction response after deferral", async () => {
    const calls: string[] = [];
    const interaction = {
      acknowledged: false,
      user: { id: 1n },
      channelId: 2n,
      defer: async () => {
        calls.push("defer");
        interaction.acknowledged = true;
      },
      edit: async () => {
        calls.push("edit");
      },
    } as unknown as DiscordInteraction;
    const command = {
      name: "slow",
      path: ["slow"],
      description: "Slow",
      type: "slash",
      aliases: [],
      context: "both",
      permissions: [],
      botPermissions: [],
      guilds: [],
      category: "general",
      syntax: "slow",
      run() {},
    } as Entry;
    const ctx = new Context("slash", interaction, command);
    await ctx.defer();
    await ctx.reply("Done");
    expect(calls).toEqual(["defer", "edit"]);
  });

  test("uses loader-provided component captures", () => {
    const interaction = {
      bot: {},
      user: { id: 1n },
    } as unknown as DiscordInteraction;
    const ctx = new ComponentContext(interaction, "ticket:42", ["42"]);
    expect(ctx.params).toEqual(["42"]);
  });

  test("reads values submitted through modal label components", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds,
    });
    const field = runtime.bot.transformers.component(runtime.bot, {
      type: 18,
      label: "Prize",
      component: {
        type: 4,
        custom_id: "prize",
        style: 1,
        value: "Nitro",
      },
    } as never);
    const interaction = {
      bot: runtime.bot,
      user: { id: 1n },
      data: { components: [field] },
    } as unknown as DiscordInteraction;
    const ctx = new ComponentContext(interaction, "giveaway_setup");

    expect(ctx.field("prize")).toBe("Nitro");
  });

  test("simulates owned components and regex captures", async () => {
    const harness = createTestKyro().component({
      id: /^profile:(\d+)$/,
      owner: (ctx) => ctx.params[0]!,
      run: (ctx) => ctx.update("Saved"),
    });
    const result = await harness.runComponent("profile:42", { userId: 42n });
    expect(result.params).toEqual(["42"]);
    expect(result.updates).toEqual(["Saved"]);
  });
});
