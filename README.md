# Kyro

Kyro is a production-oriented TypeScript framework built natively on [Discordeno](https://discordeno.js.org/). It provides file-based and programmatic commands, typed events, component and modal routing, middleware, plugins, dependency-injected services, PostgreSQL integration, modern Discord UI payloads, and deterministic startup, reload, and shutdown behavior.

Kyro owns its framework abstractions and routing. It does not wrap or emulate discord.js. Discordeno remains available through `kyro.client` whenever an application needs direct REST, gateway, or helper access.

## Contents

- [Requirements](#requirements)
- [Discord application setup](#discord-application-setup)
- [Create a bot](#create-a-bot)
- [Configuration reference](#configuration-reference)
- [Project layout and file loaders](#project-layout-and-file-loaders)
- [Commands](#commands)
- [Middleware, permissions, and errors](#middleware-permissions-and-errors)
- [Events](#events)
- [Components and modals](#components-and-modals)
- [UI helpers](#ui-helpers)
- [Services and plugins](#services-and-plugins)
- [Database](#database)
- [Lifecycle and reloading](#lifecycle-and-reloading)
- [Direct Discordeno access](#direct-discordeno-access)
- [Deployment](#deployment)
- [Migration from discord.js](#migration-from-discordjs)
- [Troubleshooting](#troubleshooting)

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer (recommended), or Node.js 22 or newer
- TypeScript 5 or newer
- A Discord application and bot token
- Discordeno 21, installed automatically with Kyro

Install Kyro in a new or existing project:

```sh
bun add @lucvmf/kyro
```

Kyro includes Discordeno. Do not install discord.js.

## Discord application setup

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. Open **Bot**, create the bot user, and reset/copy its token. Treat the token like a password.
3. Enable only the privileged gateway intents your bot needs. Message and hybrid commands require **Message Content Intent**.
4. Open **OAuth2 > URL Generator** and select the `bot` and `applications.commands` scopes.
5. Select the permissions your bot needs, copy the generated URL, and invite the bot to a development server.
6. Copy the application ID from **General Information**. To copy a server ID, enable Developer Mode in Discord and use **Copy Server ID**.

Use a development guild while building. Guild commands update almost immediately; global command updates can take longer to appear.

Create a `.env` file and keep it out of source control:

```dotenv
DISCORD_TOKEN=your_bot_token
DISCORD_APP_ID=123456789012345678
DISCORD_GUILD_ID=123456789012345678
```

## Create a bot

The smallest working project needs a package file, TypeScript configuration, and entry point.

`package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/bot.ts",
    "start": "bun src/bot.ts",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "@lucvmf/kyro": "latest"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "types": ["bun"]
  },
  "include": ["src"]
}
```

`src/bot.ts`:

```ts
import { GatewayIntents } from "discordeno";
import { Kyro } from "@lucvmf/kyro";

const token = process.env.DISCORD_TOKEN;
const appID = process.env.DISCORD_APP_ID;
const guildID = process.env.DISCORD_GUILD_ID;

if (!token || !appID) {
  throw new Error("DISCORD_TOKEN and DISCORD_APP_ID are required.");
}

const bot = new Kyro({
  token,
  appID,
  guildID,
  sync: guildID ? "guild" : "global",
  intents: GatewayIntents.Guilds,
  commands: `${import.meta.dir}/commands`,
  events: `${import.meta.dir}/events`,
  components: `${import.meta.dir}/components`,
  hooks: {
    afterStart: (kyro) => {
      console.info(`Connected as ${kyro.client.id}.`);
    },
  },
});

await bot.start();
```

Create `src/commands/ping.ts`:

```ts
import { cmd } from "@lucvmf/kyro";

export default cmd({
  name: "ping",
  description: "Check whether the bot is responding.",
  run: (ctx) => ctx.reply("Pong!"),
});
```

Start the bot:

```sh
bun run dev
```

The command should appear in the configured development server. An executable programmatic example also lives in [`examples/bot.ts`](./examples/bot.ts).

## Configuration reference

`new Kyro(options)` accepts one flat object, as shown above. For applications that prefer separation, Discord connection fields may be placed under `client` and framework fields under `config`.

```ts
const bot = new Kyro({
  client: {
    token,
    appID,
    intents: GatewayIntents.Guilds,
  },
  config: {
    commands: `${import.meta.dir}/commands`,
    sync: "guild",
    guildID,
  },
  onError: (error, ctx) => console.error(ctx.command.name, error),
});
```

### Discord connection options

| Option     | Type                       | Description                                                              |
| ---------- | -------------------------- | ------------------------------------------------------------------------ |
| `token`    | `string`                   | Required Discord bot token.                                              |
| `appID`    | `string`                   | Required Discord application ID. Configuration IDs remain strings.       |
| `intents`  | `GatewayIntents`           | Required Discordeno gateway intent bitfield. Combine intents with `\|`.  |
| `gateway`  | Discordeno gateway options | Advanced gateway manager overrides. Kyro supplies the token and intents. |
| `rest`     | Discordeno REST options    | Advanced REST manager overrides. Kyro supplies the token.                |
| `presence` | Discordeno status update   | Initial activities and status.                                           |

Example intents for slash, guild-message, and DM-message commands:

```ts
const intents =
  GatewayIntents.Guilds |
  GatewayIntents.GuildMessages |
  GatewayIntents.DirectMessages |
  GatewayIntents.MessageContent;
```

Request the smallest set of intents your application needs. Privileged intents must also be enabled in the Developer Portal.

### Framework options

| Option                | Default       | Description                                                                            |
| --------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `commands`            | none          | Absolute directory containing command modules.                                         |
| `events`              | none          | Absolute directory containing event modules.                                           |
| `components`          | none          | Absolute directory containing component/modal modules.                                 |
| `sync`                | `"global"`    | Command registration strategy: `"global"`, `"guild"`, or `"none"`.                     |
| `guildID`             | none          | Development guild used by `sync: "guild"`. Required for guild sync.                    |
| `guilds`              | `[]`          | Restricts registration to an explicit list of guild IDs where supported.               |
| `prefix`              | `"!"`         | Message prefix, an async prefix resolver, or multiple prefixes returned by a resolver. |
| `getAlias`            | none          | Async application-specific alias lookup for message input.                             |
| `cooldown`            | `0`           | Global command/component cooldown in seconds. Zero disables it.                        |
| `help`                | `false`       | Adds Kyro's generated message help command.                                            |
| `middleware`          | `[]`          | Global command middleware, in declaration order.                                       |
| `plugins`             | `[]`          | Plugin objects or absolute plugin module paths.                                        |
| `ownerIDs`            | `[]`          | Application owner IDs used by owner-only framework functionality.                      |
| `permissions`         | none          | Custom fallback resolver for missing user permissions.                                 |
| `replies`             | defaults      | Overrides framework-generated command responses.                                       |
| `onError`             | logger        | Global unexpected command error handler.                                               |
| `database`            | none          | A Kyro `DrizzleDB` connection, closed during shutdown.                                 |
| `services`            | none          | Iterable of `[token, instance]` dependency entries.                                    |
| `hooks`               | none          | Lifecycle callbacks.                                                                   |
| `onStop`              | none          | Additional shutdown callback retained for compatibility.                               |
| `logger`              | console       | Structured logger implementation.                                                      |
| `onFrameworkError`    | logger        | Receives normalized framework failures and metadata.                                   |
| `rateLimit`           | none          | Default adapter-backed rate-limit policy.                                              |
| `autoDefer`           | `false`       | Automatically acknowledges long-running interactions.                                  |
| `timeout`             | `30000`       | Default handler abort timeout in milliseconds.                                         |
| `shutdownTimeout`     | `10000`       | Maximum time to drain active work.                                                     |
| `componentMiddleware` | `[]`          | Global component and modal middleware.                                                 |
| `groupMiddleware`     | `{}`          | Middleware keyed by command category or root.                                          |
| `messages`            | safe mentions | Default allowed-mention policy.                                                        |
| `instrumentation`     | no-op         | Trace/span adapter suitable for OpenTelemetry.                                         |
| `syncRetries`         | `2`           | Command-registration retry count.                                                      |
| `syncLock`            | none          | Optional distributed synchronization lock.                                             |

Paths passed to loaders should be absolute. With Bun, `` `${import.meta.dir}/commands` `` is the simplest portable choice.

## Project layout and file loaders

A typical application looks like this:

```text
src/
  bot.ts
  commands/
    ping.ts
    profile/
      avatar.ts
  components/
    profile-edit.ts
    profile-modal.ts
  events/
    ready.ts
    message-create.ts
  plugins/
    metrics.ts
```

Loader modules should default-export the relevant `cmd()`, `cmp()`, or `evt()` definition. Nested directories are supported. The module filename is organizational; the definition's `name` or `id` controls routing.

Commands can also be registered before startup without a loader:

```ts
bot.command(
  cmd({
    name: "ping",
    description: "Check the bot.",
    run: (ctx) => ctx.reply("Pong!"),
  }),
);
```

## Commands

`cmd()` defines slash, message, or hybrid commands:

- `slash` is the default and registers an application command.
- `message` listens for prefixed messages only.
- `hybrid` supports both sources with one handler.

```ts
import { cmd } from "@lucvmf/kyro";

export default cmd({
  name: "profile avatar",
  description: "Show a user's avatar.",
  type: "hybrid",
  aliases: ["avatar", "pfp"],
  context: "guild",
  category: "Profile",
  syntax: "profile avatar [user]",
  example: "profile avatar @Kyro",
  args: {
    user: {
      type: "user",
      description: "User to show.",
      required: false,
    },
  },
  async run(ctx) {
    const user = ctx.user("user") ?? ctx.author;
    await ctx.reply(`Selected <@${user.id}>`);
  },
});
```

Names containing spaces compile to slash subcommands and use the same route for message commands. For example, `profile avatar` becomes `/profile avatar` and `!profile avatar`.

### Command definition

| Field                                           | Description                                                   |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `name`                                          | Command route. Space-separated names create subcommand paths. |
| `description`                                   | Discord command description.                                  |
| `type`                                          | `"slash"`, `"message"`, or `"hybrid"`; defaults to slash.     |
| `aliases`                                       | Alternative message-command names.                            |
| `args`                                          | Ordered argument definition object.                           |
| `context`                                       | `"both"`, `"guild"`, or `"dms"`.                              |
| `permissions`                                   | Discord permission names required from the invoking member.   |
| `botPermissions`                                | Discord permission names required by the bot.                 |
| `guilds`                                        | Guild allowlist for the command.                              |
| `category`, `syntax`, `example`                 | Help/catalog metadata.                                        |
| `nameLocalizations`, `descriptionLocalizations` | Discord localization maps.                                    |
| `meta`                                          | Read-only application metadata.                               |
| `autocomplete`                                  | Autocomplete handler for arguments that enable it.            |
| `run`                                           | Command handler.                                              |

### Arguments

Supported types are `string`, `number`, `integer`, `boolean`, `user`, `role`, `channel`, and `attachment`. Strings support `minLength`/`maxLength`, numbers support `min`/`max`, and channels support `channelTypes`.

```ts
args: {
  action: {
    type: "string",
    description: "What to do.",
    required: true,
    choices: [
      { name: "Add", value: "add" },
      { name: "Remove", value: "remove" },
    ],
  },
  amount: {
    type: "number",
    description: "Amount to use.",
    default: 1,
  },
}
```

Required arguments must be declared before optional arguments. Defaults are supported for string, number, and boolean arguments. An argument cannot use both `choices` and `autocomplete`.

Read values with the matching context accessor:

```ts
const action = ctx.string("action");
const amount = ctx.number("amount");
const enabled = ctx.boolean("enabled");
const user = ctx.user("user");
const role = ctx.role("role");
const channel = ctx.channel("channel");
```

Accessors return `null` when an optional value is absent. They throw if the named argument is missing from the command definition or has a different type, catching handler mistakes early.

### Autocomplete

Autocomplete is available for string and number arguments:

```ts
export default cmd({
  name: "search",
  description: "Search the catalog.",
  args: {
    query: {
      type: "string",
      description: "Search term.",
      required: true,
      autocomplete: true,
    },
  },
  autocomplete: (ctx) => {
    const input = ctx.value.toLowerCase();
    return catalog
      .filter((item) => item.toLowerCase().includes(input))
      .slice(0, 25)
      .map((item) => ({ name: item, value: item }));
  },
  run: (ctx) => ctx.reply(`Searching for ${ctx.string("query")}`),
});
```

Discord accepts at most 25 autocomplete choices.

### Command context

Every handler receives a normalized `Context` with:

- `source`: `"slash"` or `"message"`
- `author`, `guild`, `guildId`, and `channelId`
- `interaction` or `message`, with the unused source set to `null`
- `command`, `commands`, `prefix`, and raw message arguments
- typed argument accessors
- `reply(content)` and `send(channel, content)`
- `defer()`, `deferPrivate()`, `editReply()`, `followUp()`, and `deleteReply()`
- `showModal(modal)` for slash interactions
- `response`, when Discord returned a response message
- lazy `mod`, `server`, `stats`, and `music` service contexts
- `services`, `service(token)`, and an abort `signal`

Discordeno represents snowflakes on Discord objects as `bigint`. Configuration IDs and environment variables remain strings. Convert only at boundaries:

```ts
const storedID = ctx.author.id.toString();
const discordID = BigInt(storedID);
```

## Middleware, permissions, and errors

Middleware wraps every command and is ideal for timing, tracing, authorization, or application-level checks. Always call `next()` when the command should continue.

```ts
import type { Middleware } from "@lucvmf/kyro";

const timing: Middleware = async (ctx, next) => {
  const started = performance.now();
  try {
    await next();
  } finally {
    console.info(ctx.command.name, performance.now() - started);
  }
};

const bot = new Kyro({
  // ...
  middleware: [timing],
});
```

Declare Discord permissions on commands and components. Kyro checks user and bot permissions before invoking the handler:

```ts
export default cmd({
  name: "ban",
  description: "Ban a member.",
  context: "guild",
  permissions: ["BanMembers"],
  botPermissions: ["BanMembers"],
  // ...
});
```

Use `permissions(ctx, missing)` in the root options to grant application-specific overrides, such as an owner or staff role. Return `true` only when the missing Discord permissions should be bypassed.

Throw `UserError` for expected, safe-to-display failures:

```ts
import { UserError } from "@lucvmf/kyro";

if (!account) throw new UserError("You do not have an account yet.");
```

Unexpected failures are sent to the root `onError` handler. Component and event definitions additionally support local `error` handlers. Log the original error, include route/context information, and avoid exposing internal exception text to users.

## Events

Event names and handler arguments are inferred from Discordeno. Kyro safely supports multiple handlers for the same Discordeno event and executes higher `priority` values first.

`src/events/message-create.ts`:

```ts
import { evt } from "@lucvmf/kyro";

export default evt({
  name: "messageCreate",
  priority: 10,
  when: (message) => !message.author.bot,
  async run(message, kyro) {
    kyro?.client.logger.debug(`Received message ${message.id}.`);
  },
  error(error, message) {
    console.error(`messageCreate failed for ${message.id}`, error);
  },
});
```

Use `once: true` for a handler that should run once. `when` may be synchronous or asynchronous. The optional final `kyro` argument gives loaded event modules access to the application instance.

## Components and modals

`cmp()` routes button clicks, select interactions, and modal submissions. IDs may be exact strings or regular expressions.

Create a button in a command:

```ts
import { button, cmd, container } from "@lucvmf/kyro";

export default cmd({
  name: "profile",
  description: "Open your profile.",
  run: (ctx) =>
    ctx.reply(
      container()
        .accent("#5865F2")
        .text("## Your profile")
        .row(button({ id: `profile:edit:${ctx.author.id}`, label: "Edit" })),
    ),
});
```

Handle it in `src/components/profile-edit.ts`:

```ts
import { cmp, modal } from "@lucvmf/kyro";

export default cmp({
  id: /^profile:edit:\\d+$/,
  async run(ctx) {
    const [, , ownerID] = ctx.params;
    if (ctx.user.id.toString() !== ownerID) {
      await ctx.private("This is not your profile.");
      return;
    }

    await ctx.showModal(
      modal({
        id: `profile:save:${ownerID}`,
        title: "Edit profile",
        inputs: [
          {
            id: "bio",
            label: "Biography",
            style: "paragraph",
            max: 500,
          },
        ],
      }),
    );
  },
});
```

Handle the submitted modal in another component module:

```ts
import { cmp } from "@lucvmf/kyro";

export default cmp({
  id: /^profile:save:\\d+$/,
  async run(ctx) {
    const bio = ctx.field("bio") ?? "";
    await ctx.private(`Saved ${bio.length} characters.`);
  },
});
```

Component contexts provide:

- `id` and colon-separated `params`
- `user`, `guild`, and raw `interaction`
- select `values`
- modal helpers: `field()`, `strings()`, `channelIds()`, and `files()`
- `reply()`, ephemeral `private()`, message `update()`, `defer()`, and `showModal()`

Definitions support `context`, member and bot permissions, per-component cooldowns, and a local `error(error, ctx)` handler.

## UI helpers

Kyro's UI helpers create Discord API payloads directly and do not use discord.js builders.

### Embeds

```ts
import { embed } from "@lucvmf/kyro";

await ctx.reply(
  embed()
    .title("Account")
    .desc("Your account is ready.")
    .color("#57F287")
    .field("Plan", "Pro", true)
    .footer("Kyro")
    .time(),
);
```

### Components V2 containers

```ts
import { button, container, select, thumb } from "@lucvmf/kyro";

await ctx.reply(
  container()
    .accent("#5865F2")
    .text("## Settings")
    .section("Update your preferences.", thumb("https://example.com/icon.png"))
    .separator()
    .row(
      select({
        id: "settings:theme",
        placeholder: "Choose a theme",
        options: [
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
        ],
      }),
    )
    .row(button({ id: "settings:save", label: "Save", style: "success" })),
);
```

Containers support text, sections, separators, galleries, files, and action rows. `button()`, `select()`, `modal()`, `input()`, `row()`, and `thumb()` can also be composed directly where their payload type is accepted.

Kyro disables automatic mentions in its normalized message helpers. This avoids accidentally pinging users or roles when rendering stored or user-supplied content.

## Services and plugins

Use `kyro.services` for application dependencies instead of module globals. Tokens may be classes, strings, or symbols.

```ts
class Accounts {
  async find(userID: bigint) {
    // ...
  }

  async dispose() {
    // Close owned resources.
  }
}

const accounts = new Accounts();
const bot = new Kyro({
  // ...
  services: [[Accounts, accounts]],
});

const service = bot.services.get(Accounts);
bot.services.set(Symbol.for("metrics"), metrics);
bot.services.replace(Accounts, replacement);
bot.services.optional(Accounts);
```

Duplicate registration through `set()` is rejected. Services implementing `dispose()` are closed once in reverse registration order during shutdown.

Plugins package related setup and teardown:

```ts
import { plugin } from "@lucvmf/kyro";

export default plugin({
  name: "metrics",
  version: "1.0.0",
  setup(kyro) {
    kyro.services.set("metrics", createMetrics());
  },
  async stop(kyro) {
    await kyro.services.optional<Metrics>("metrics")?.flush();
  },
});
```

Pass plugin objects or absolute module paths in `plugins`. Plugins may register commands and services through the same Kyro instance. They participate in startup, reload, and shutdown.

## Database

Kyro provides a lightweight PostgreSQL/Drizzle connection wrapper:

```ts
import { drizzle, Kyro } from "@lucvmf/kyro";
import * as schema from "./db/schema.ts";

const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) throw new Error("DATABASE_URL is required.");

const database = drizzle(databaseURL, { schema });

const bot = new Kyro({
  // ...
  database,
});

const rows = await bot.db?.db.query.users.findMany();
```

Kyro closes the connection during graceful shutdown. Schema migrations remain the application's responsibility; use the standard Drizzle tooling in development and deployment.

## Lifecycle and reloading

Lifecycle hooks make startup and shutdown work explicit:

```ts
const bot = new Kyro({
  // ...
  hooks: {
    beforeLoad: async (kyro) => {},
    afterLoad: async (kyro) => {},
    beforeStart: async (kyro) => {},
    afterStart: async (kyro) => {},
    beforeStop: async (kyro) => {},
    afterStop: async (kyro) => {},
    afterReload: async (kyro) => {},
  },
});
```

Startup order:

1. `beforeLoad`
2. Load commands, events, components, and plugins
3. Validate command requirements and seal the registry
4. Attach routers
5. `afterLoad`, then `beforeStart`
6. Connect Discordeno and wait for the ready event
7. Synchronize application commands unless `sync` is `"none"`
8. `afterStart`

`await bot.reload()` detaches routers, reloads definitions and plugins, reseals the registry, synchronizes commands, and invokes `afterReload`. The bot must already be ready.

`await bot.stop()` runs shutdown once, detaches routing, unloads plugins, closes the database, disposes services, and invokes stop hooks. `SIGINT` and `SIGTERM` use the same graceful path.

## Direct Discordeno access

Kyro deliberately keeps an escape hatch for platform features that do not need framework abstractions:

```ts
await bot.client.helpers.sendMessage(channelID, {
  content: "Sent directly through Discordeno.",
});
```

- `kyro.client` is the Discordeno `Bot`.
- `kyro.client.helpers` contains typed Discord REST helpers.
- `kyro.client.rest` provides lower-level REST access.
- `kyro.client.gateway` provides gateway, shard, status, and voice operations.
- `kyro.runtime` is Kyro's typed multi-listener event boundary.

Guild administration helpers are Discordeno-native and use explicit dependencies:

```ts
import { BotProfile, Server } from "@lucvmf/kyro";

const guildID = BigInt(process.env.DISCORD_GUILD_ID!);
const server = new Server(bot.client, guildID);
const profile = new BotProfile(bot.client, guildID);
```

## Deployment

Before deploying, run the release gate:

```sh
bun run check
bun test
bun run build
```

For an application using Kyro, a simple production script can run the TypeScript entry point with Bun:

```sh
bun src/bot.ts
```

Production recommendations:

- Store tokens and database URLs in your host's secret manager, never in Git.
- Use `sync: "guild"` in development and `sync: "global"` for production commands.
- Use `sync: "none"` only when another deployment step owns command registration.
- Enable only required gateway intents and Discord permissions.
- Configure `onError` and lifecycle hooks to feed structured logs or monitoring.
- Let the process receive `SIGTERM` so Kyro can close plugins, services, and the database cleanly.
- Run one command synchronization owner during multi-instance deployments to avoid redundant registration.

## Migration from discord.js

The command, event, component, plugin, and loader concepts remain intact. Platform-level changes are intentional:

| discord.js                      | Kyro with Discordeno                                                       |
| ------------------------------- | -------------------------------------------------------------------------- |
| `Client`                        | `kyro.client`, a Discordeno `Bot`                                          |
| `GatewayIntentBits`             | `GatewayIntents`                                                           |
| String IDs on objects           | `bigint` snowflakes on Discordeno objects                                  |
| `client.on(...)`                | `evt()` files or `kyro.runtime.on(...)`                                    |
| Collection/cache-centric access | Discordeno helpers and explicit REST calls                                 |
| Builder classes                 | Kyro `embed()`, `container()`, `button()`, `modal()`, and raw API payloads |
| `channel.send(...)`             | `bot.helpers.sendMessage(...)`, `ctx.send(...)`, or Kyro `send(...)`       |
| Stateful guild wrappers         | Explicit `new Server(bot, guildID)` and related services                   |
| `ShardingManager` wrappers      | Discordeno gateway manager                                                 |
| Partials                        | Not applicable; design around Discordeno events and REST helpers           |

Common conversions:

```ts
// discord.js
await channel.send("Hello");

// Kyro context
await ctx.send(channel, "Hello");

// Discordeno directly
await bot.client.helpers.sendMessage(channel.id, { content: "Hello" });
```

Do not convert Discordeno objects back into discord.js-like classes. Keep application logic on Kyro contexts/services and use Discordeno helpers at platform boundaries.

## Troubleshooting

### Commands do not appear

- Confirm the invite used both `bot` and `applications.commands` scopes.
- During development, set `sync: "guild"` and provide the correct `guildID`.
- Verify `DISCORD_APP_ID` is the application ID, not the bot token or guild ID.
- Confirm the loader path is absolute and the file default-exports `cmd(...)`.
- Global command propagation may not be immediate.

### Message commands do not run

- Set the command `type` to `"message"` or `"hybrid"`.
- Add `GatewayIntents.GuildMessages` and `GatewayIntents.MessageContent`.
- Enable Message Content Intent in the Developer Portal.
- For DM commands, also add `GatewayIntents.DirectMessages` and use `context: "both"` or `"dms"`.
- Confirm the configured prefix matches the message.

### The bot reports missing intents

Kyro validates intents before connecting when loaded commands require them. Add the named intent to the bitfield and, when privileged, enable it in the Developer Portal.

### An ID causes a type error

Environment/configuration IDs are strings. Discordeno object IDs are `bigint`. Use `BigInt(value)` when entering Discordeno APIs and `.toString()` when storing or displaying an ID.

### A component does not respond

- Configure the `components` loader directory.
- Ensure the component's custom ID matches the `cmp()` string or regular expression.
- Acknowledge interactions promptly with `reply()`, `private()`, `update()`, or `defer()`.
- Use `showModal()` only from slash commands, buttons, or selects as allowed by Discord.

### Permission checks fail unexpectedly

Use `context: "guild"` whenever a definition declares member or bot permissions. Confirm the bot's role is high enough in the server role hierarchy; Discord permission bits alone cannot override role hierarchy.

### Shutdown hangs or resources leak

Give resource-owning services a `dispose()` method and plugins a `stop()` method. Await asynchronous work in lifecycle hooks. Allow the process manager to deliver `SIGTERM` before forcing termination.

## Production capabilities

### Scoped middleware, rate limits, and concurrency

Commands may declare `middleware`, `timeout`, `autoDefer`, `concurrency`, and `rateLimit`. Global middleware runs first, followed by matching category/root middleware and command middleware.

```ts
export default cmd({
  name: "report create",
  description: "Create a report.",
  autoDefer: { after: 2_000, private: true },
  timeout: 20_000,
  concurrency: { max: 1, scope: "user" },
  rateLimit: { limit: 5, window: 60, scope: "guild" },
  middleware: [requireAccount],
  async run(ctx) {
    const accounts = ctx.service(Accounts);
    await accounts.create(ctx.author.id, { signal: ctx.signal });
    await ctx.reply("Created.");
  },
});
```

The built-in limiter is process-local. Implement `RateLimitAdapter.consume()` with an atomic Redis operation for multi-process deployments. Implement `SyncLock.run()` with the same shared store so only one process owns application-command synchronization.

### Component ownership and signed IDs

String routes pass their trailing segments through `ctx.params`; regular expressions pass capture groups. Components may enforce ownership before their middleware and handler execute:

```ts
export default cmp({
  id: /^invoice:pay:(\d+)$/,
  owner: (ctx) => ctx.params[0]!,
  run: (ctx) => ctx.update("Paid."),
});
```

`ComponentSigner` produces HMAC-signed custom IDs for controls whose parameters must not be altered. Construct it with a deployment secret of at least 16 characters, call `sign(id)`, and accept a value only when `verify(value)` returns the original ID.

### Logging, errors, tracing, and health

Supply any implementation of Kyro's `Logger` interface. `onFrameworkError` receives a normalized `FrameworkError` with its phase, cause, route, and available user, guild, and interaction IDs. The instrumentation interface starts spans for commands, components, and loaded events and can be backed by OpenTelemetry without adding it as a required dependency.

```ts
const bot = new Kyro({
  // ...
  logger: appLogger,
  onFrameworkError: (error) => errorReporter.capture(error),
  instrumentation: tracingAdapter,
});

console.info(bot.health());
```

`health()` reports readiness, uptime, loaded definition counts, active handlers, guild count, accumulated errors, and the last successful synchronization. During shutdown Kyro stops accepting work, signals cancellation through `ctx.signal` and `kyro.signal`, drains active handlers up to `shutdownTimeout`, and then disposes plugins, the database, and services.

### Plugin dependencies and scheduling

Plugins may declare `requires` for explicit load ordering and `kyro` for major-version compatibility. The optional `scheduler()` plugin runs named interval tasks and cancels them during shutdown:

```ts
plugins: [
  scheduler({
    name: "refresh-stats",
    every: 60_000,
    immediate: true,
    run: (kyro, signal) => refreshStats(kyro, signal),
  }),
];
```

### CLI and testing harness

The package installs a `kyro` executable:

```sh
kyro validate src/commands
kyro generate command admin/ban
kyro generate event guild-create
kyro generate component ticket/close
kyro commands diff src/kyro.ts
kyro commands sync src/kyro.ts
```

The sync/diff module must default-export a configured Kyro instance. Validation loads and compiles commands without connecting the gateway.

Use the testing harness for command unit tests without Discord:

```ts
const app = createTestKyro(pingCommand);
const result = await app.run("ping");
expect(result.replies).toEqual(["Pong!"]);
```

## Development

Kyro's own validation commands are:

```sh
bun run format:check
bun run check
bun test
bun run build
```

Contributions should preserve Kyro's public abstractions, keep Discordeno-specific operations at clear platform boundaries, and include focused tests for routing or lifecycle behavior.
