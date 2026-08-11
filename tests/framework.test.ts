import { describe, expect, test } from "bun:test";
import {
  ApplicationCommandOptionTypes,
  BitwisePermissionFlags,
  DiscordInteractionContextType,
  GatewayIntents,
  type CreateSlashApplicationCommand,
  type Guild,
  type Role,
  type User,
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
  freshMemberCount,
  runtimeStats,
  type DiscordInteraction,
} from "../src/core/Discord.ts";
import type { Entry } from "../src/commands/Cmd.ts";
import { Music } from "../src/plugins/music/Music.ts";
import { missingPermissions } from "../src/guild/Permissions.ts";
import { Guard } from "../src/commands/Guard.ts";
import { findRole, findUser } from "../src/guild/Lookup.ts";
import { Moderation } from "../src/commands/Moderation.ts";

describe("Discordeno migration boundary", () => {
  test("finds users and roles from natural message input", () => {
    const user = {
      id: 123456789012345678n,
      username: "lucvxc",
    } as User;
    const helper = {
      id: 223456789012345678n,
      username: "helper",
    } as User;
    const guild = {
      id: 323456789012345678n,
      members: new Map([
        [user.id, { user }],
        [helper.id, { user: helper }],
      ]),
      roles: new Map([
        [
          423456789012345678n,
          { id: 423456789012345678n, name: "Trusted Members" } as Role,
        ],
      ]),
    } as unknown as Guild;

    expect(findUser(guild, "lucvxc")).toBe(user);
    expect(findUser(guild, String(user.id))).toBe(user);
    expect(findUser(guild, `<@${user.id}>`)).toBe(user);
    expect(findRole(guild, "Trusted Members")?.name).toBe("Trusted Members");
    expect(findRole(guild, "423456789012345678")?.name).toBe("Trusted Members");
    expect(findRole(guild, "trust")?.name).toBe("Trusted Members");
  });

  test("parses role names in prefix commands", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds | GatewayIntents.GuildMessages,
    });
    const role = { id: 3n, name: "Founder" } as Role;
    const guild = {
      id: 1n,
      roles: new Map([[role.id, role]]),
    } as unknown as Guild;
    runtimeStats(runtime.bot).guildObjects.set(guild.id, guild);
    const command = {
      name: "role info",
      args: { role: { type: "role" } },
    } as unknown as Entry;
    const message = {
      id: 4n,
      guildId: guild.id,
      channelId: 5n,
      author: { id: 6n, username: "lucvxc" },
      mentions: [],
    };

    const ctx = new Context(
      "message",
      message as never,
      command,
      ["founder"],
      undefined,
      ",",
      runtime.bot,
    );

    expect(ctx.issue).toBeUndefined();
    expect(ctx.role("role")).toBe(role);
  });

  test("administrator satisfies every declared permission", () => {
    expect(
      missingPermissions(BitwisePermissionFlags.ADMINISTRATOR, [
        "MANAGE_GUILD_EXPRESSIONS",
        "BAN_MEMBERS",
      ]),
    ).toEqual([]);
    expect(missingPermissions(0n, ["MANAGE_GUILD_EXPRESSIONS"])).toEqual([
      "MANAGE_GUILD_EXPRESSIONS",
    ]);
  });

  test("allows manageable roles to be assigned to the server owner", async () => {
    const guildId = 1n;
    const ownerId = 2n;
    const actorId = 3n;
    const botId = 4n;
    const roleId = 5n;
    const botRoleId = 6n;
    const actorRoleId = 7n;
    const ownerRoleId = 8n;
    let assigned = false;
    const members = new Map([
      [ownerId, { id: ownerId, roles: [ownerRoleId] }],
      [actorId, { id: actorId, roles: [actorRoleId] }],
      [botId, { id: botId, roles: [botRoleId] }],
    ]);
    const roles = [
      {
        id: guildId,
        position: 0,
        permissions: { bitfield: 0n },
      },
      {
        id: roleId,
        position: 5,
        managed: false,
        permissions: { bitfield: 0n },
      },
      {
        id: botRoleId,
        position: 10,
        permissions: { bitfield: BitwisePermissionFlags.MANAGE_ROLES },
      },
      {
        id: actorRoleId,
        position: 9,
        permissions: { bitfield: BitwisePermissionFlags.MANAGE_ROLES },
      },
      {
        id: ownerRoleId,
        position: 100,
        permissions: { bitfield: BitwisePermissionFlags.ADMINISTRATOR },
      },
    ];
    const bot = {
      id: botId,
      helpers: {
        getGuild: async () => ({ id: guildId, ownerId }),
        getMember: async (_guildId: bigint, userId: bigint) =>
          members.get(userId),
        getRoles: async () => roles,
        addRole: async () => {
          assigned = true;
        },
      },
    };
    const moderation = new Moderation(bot as never, guildId, {
      id: actorId,
      username: "moderator",
    } as User);

    await moderation.role(
      { id: ownerId, username: "owner" } as User,
      roles[1] as Role,
      true,
    );

    expect(assigned).toBe(true);
  });

  test("refreshes stale interaction permissions before denying a command", async () => {
    const guildId = 1n;
    const channelId = 2n;
    const userId = 3n;
    const adminRoleId = 4n;
    const member = { id: userId, roles: [adminRoleId] };
    const guild = {
      id: guildId,
      ownerId: 99n,
      roles: new Map([
        [guildId, { id: guildId, permissions: { bitfield: 0n } }],
        [
          adminRoleId,
          {
            id: adminRoleId,
            permissions: { bitfield: BitwisePermissionFlags.ADMINISTRATOR },
          },
        ],
      ]),
      members: new Map([[userId, member]]),
      channels: new Map([
        [channelId, { id: channelId, permissionOverwrites: [] }],
      ]),
    };
    const ctx = {
      interaction: { member: { permissions: { bitfield: 0n } } },
      guildId,
      channelId,
      author: { id: userId },
      client: { helpers: { getGuild: async () => guild } },
    };
    const command = {
      permissions: ["MODERATE_MEMBERS"],
      botPermissions: [],
    };

    expect(
      await new Guard().check(command as never, ctx as never),
    ).toBeUndefined();
  });

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

  test("keeps guild member counts current after joins and leaves", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds | GatewayIntents.GuildMembers,
    });
    const guild = {
      id: 1n,
      memberCount: 25,
      members: new Map(),
    } as unknown as Guild;
    const state = runtimeStats(runtime.bot);
    state.guildObjects.set(guild.id, guild);
    state.guildMembers.set(guild.id, guild.memberCount!);

    runtime.bot.events.guildMemberAdd?.(
      { guildId: guild.id } as never,
      {} as never,
    );
    expect(state.guildMembers.get(guild.id)).toBe(26);
    expect(guild.memberCount).toBe(26);

    runtime.bot.events.guildMemberRemove?.({} as never, guild.id);
    expect(state.guildMembers.get(guild.id)).toBe(25);
    expect(guild.memberCount).toBe(25);
  });

  test("keeps cached presences current", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds | GatewayIntents.GuildPresences,
    });
    const guild = {
      id: 1n,
      presences: [
        { guildId: 1n, user: { id: 2n }, status: "idle" },
        { guildId: 1n, user: { id: 3n }, status: "online" },
      ],
    } as unknown as Guild;
    runtimeStats(runtime.bot).guildObjects.set(guild.id, guild);

    runtime.bot.events.presenceUpdate?.({
      guildId: guild.id,
      user: { id: 2n },
      status: "dnd",
    } as never);

    expect(guild.presences).toHaveLength(2);
    expect(
      String(guild.presences?.find((entry) => entry.user.id === 2n)?.status),
    ).toBe("dnd");
  });

  test("adds the guild ID to initial Discord presences", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds | GatewayIntents.GuildPresences,
    });
    const guild = runtime.bot.transformers.guild(runtime.bot, {
      guild: {
        id: "1",
        presences: [
          {
            user: { id: "2", username: "member", discriminator: "0" },
            status: "online",
            activities: [],
            client_status: {},
          },
        ],
      },
      shardId: 0,
    } as never);

    expect(guild.presences?.[0]?.guildId).toBe(1n);
    expect(guild.presences?.[0]?.user.id).toBe(2n);
  });

  test("reconciles cached member counts with Discord", async () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds,
    });
    const guild = { id: 1n, memberCount: 10 } as unknown as Guild;
    const state = runtimeStats(runtime.bot);
    state.guildObjects.set(guild.id, guild);
    state.guildMembers.set(guild.id, 10);
    runtime.bot.rest.getGuild = (() =>
      Promise.resolve({ approximateMemberCount: 42 })) as never;

    expect(await freshMemberCount(runtime.bot, guild.id)).toBe(42);
    expect(state.guildMembers.get(guild.id)).toBe(42);
    expect(guild.memberCount).toBe(42);
  });

  test("keeps cached guild channels and roles current", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds,
    });
    const guild = {
      id: 1n,
      channels: new Map(),
      roles: new Map(),
    } as unknown as Guild;
    runtimeStats(runtime.bot).guildObjects.set(guild.id, guild);

    runtime.bot.events.channelCreate?.({ id: 2n, guildId: guild.id } as never);
    runtime.bot.events.roleCreate?.({ id: 3n, guildId: guild.id } as never);
    expect(guild.channels.has(2n)).toBeTrue();
    expect(guild.roles.has(3n)).toBeTrue();

    runtime.bot.events.channelDelete?.({ id: 2n, guildId: guild.id } as never);
    runtime.bot.events.roleDelete?.({ roleId: 3n, guildId: guild.id });
    expect(guild.channels.has(2n)).toBeFalse();
    expect(guild.roles.has(3n)).toBeFalse();
  });

  test("does not append the discontinued discriminator to modern users", () => {
    const runtime = new DiscordRuntime({
      token: "MTIzNDU2Nzg5MDEyMzQ1Njc4.test.test",
      applicationId: 1n,
      intents: GatewayIntents.Guilds,
    });
    const user = runtime.bot.transformers.user(runtime.bot, {
      id: "1",
      username: "june",
      discriminator: "0",
    } as never);
    expect(user.tag).toBe("june");
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

  test("keeps components-v2 enabled on private component replies", async () => {
    let payload: { flags?: bigint | number } | undefined;
    let responseOptions: unknown = "not called";
    const interaction = {
      bot: {},
      user: { id: 1n },
      respond: async (value: typeof payload, options?: unknown) => {
        payload = value;
        responseOptions = options;
      },
    } as unknown as DiscordInteraction;
    const ctx = new ComponentContext(interaction, "private");

    await ctx.private(container().text("Private container"));

    expect(Number(payload?.flags)).toBe(32_768 | 64);
    expect(responseOptions).toBeUndefined();
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
