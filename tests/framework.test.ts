import { describe, expect, test } from "bun:test";
import {
  ApplicationCommandOptionTypes,
  DiscordInteractionContextType,
  GatewayIntents,
  type CreateSlashApplicationCommand,
} from "discordeno";
import { Registry } from "../src/commands/Registry.ts";
import { compileSlash } from "../src/commands/Compiler.ts";
import { container } from "../src/ui/Container.ts";
import { button, select } from "../src/ui/Control.ts";
import { messageOptions } from "../src/ui/Message.ts";
import { Services } from "../src/core/Services.ts";
import { ComponentSigner } from "../src/components/SignedId.ts";
import { MemoryRateLimitAdapter } from "../src/core/RateLimit.ts";
import { createTestKyro } from "../src/testing/Harness.ts";
import { validateConfig, ConfigurationError } from "../src/core/Config.ts";
import { WorkTracker } from "../src/core/Work.ts";
import { Context } from "../src/commands/Context.ts";
import { ComponentContext } from "../src/components/Context.ts";
import type { DiscordInteraction } from "../src/core/Discord.ts";
import type { Entry } from "../src/commands/Cmd.ts";

describe("Discordeno migration boundary", () => {
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
