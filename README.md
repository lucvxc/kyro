# Kyro

Kyro is a TypeScript framework built on top of Discord.js. It removes the repetitive parts of building a Discord bot while keeping Discord.js available whenever you need it.

It provides file-based commands, events and components, message and slash command routing, argument parsing, permissions, cooldowns, middleware, modern Discord UI builders, plugins, PostgreSQL integration and graceful shutdown.

## Requirements

- [Bun](https://bun.sh/) or Node.js with a TypeScript build step
- Discord.js 14.26.5 or newer within major version 14
- TypeScript 5 or newer
- A Discord application and bot token

Message commands require the `MessageContent` privileged intent to be enabled in the Discord Developer Portal.

## Installation

From GitHub:

```bash
bun add github:june-bot-org/kyro
```

For a private repository, use an authenticated Git remote:

```bash
bun add git+ssh://git@github.com/june-bot-org/kyro.git
```

Install Discord.js in the bot project as well:

```bash
bun add discord.js
```

## Quick start

```ts
// index.ts
import { GatewayIntentBits, Partials } from "discord.js";
import { Kyro } from "@lucvmf/kyro";

const bot = new Kyro({
  token: process.env.DISCORD_TOKEN!,
  appID: process.env.DISCORD_APP_ID!,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
  commands: `${import.meta.dir}/commands`,
  events: `${import.meta.dir}/events`,
  components: `${import.meta.dir}/components`,
  prefix: ",",
  sync: "global",
  help: true,
});

await bot.start();
```

```ts
// commands/ping.ts
import { cmd } from "@lucvmf/kyro";

export default cmd({
  name: "ping",
  description: "Check the bot latency.",
  type: "hybrid",
  async run(ctx) {
    await ctx.reply(`Pong! ${ctx.client.ws.ping}ms`);
  },
});
```

Run the bot:

```bash
bun run index.ts
```

Kyro loads every default export below the configured directories. Files can be nested however you prefer; command names and categories come from command metadata, not file paths.

## Project structure

```text
my-bot/
├─ commands/
│  ├─ info/
│  │  └─ ping.ts
│  └─ moderation/
│     └─ ban.ts
├─ components/
│  └─ confirm.ts
├─ events/
│  └─ ready.ts
└─ index.ts
```

## Configuration

`new Kyro(options)` accepts a flat object, or separate `client` and `config` objects.

| Option        | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| `token`       | Discord bot token. Required.                                 |
| `appID`       | Discord application ID. Required.                            |
| `intents`     | Discord gateway intents. Required.                           |
| `partials`    | Discord.js partials.                                         |
| `presence`    | Initial Discord presence.                                    |
| `commands`    | Absolute path to the command directory.                      |
| `events`      | Absolute path to the event directory.                        |
| `components`  | Absolute path to the component directory.                    |
| `prefix`      | Message prefix or an async prefix function. Defaults to `!`. |
| `getAlias`    | Looks up a custom command alias for a guild.                 |
| `cooldown`    | Default command/component cooldown in seconds.               |
| `sync`        | `global`, `guild`, or `none`. Defaults to global.            |
| `guildID`     | Development guild used by `sync: "guild"`.                   |
| `guilds`      | Guild restrictions used by command registration.             |
| `help`        | Adds Kyro's default help command.                            |
| `ownerIDs`    | User IDs allowed to use framework owner commands.            |
| `middleware`  | Middleware applied to every command.                         |
| `plugins`     | Plugin objects or plugin directory paths.                    |
| `permissions` | Custom permission resolver.                                  |
| `replies`     | Custom framework reply builders.                             |
| `onError`     | Central command error callback.                              |
| `database`    | A Kyro `DrizzleDB` instance.                                 |
| `onStop`      | Async cleanup called during shutdown.                        |

Kyro disables automatic mentions by default. It uses `allowedMentions: { parse: [], repliedUser: false }` unless you explicitly override those settings.

### Dynamic prefixes

```ts
const bot = new Kyro({
  // client options...
  prefix: async (message) => getGuildPrefix(message.guildId),
});
```

### Command synchronization

- `global` publishes slash commands globally.
- `guild` publishes commands to `guildID` for fast development updates.
- `none` loads commands locally without contacting Discord's command API.

Use guild synchronization while developing and global synchronization in production.

## Commands

Commands are created with `cmd()` and exported as the file's default export.

```ts
import { cmd } from "@lucvmf/kyro";

export default cmd({
  name: "avatar",
  description: "Show a user's avatar.",
  type: "hybrid",
  aliases: ["av", "pfp"],
  category: "info",
  context: "both",
  syntax: "avatar [user]",
  example: "avatar @June",
  args: {
    user: {
      type: "user",
      description: "The user to display.",
    },
  },
  async run(ctx) {
    const user = ctx.user("user") ?? ctx.author;
    await ctx.reply(user.displayAvatarURL({ size: 1024 }));
  },
});
```

### Command types

| Type      | Behavior                                                  |
| --------- | --------------------------------------------------------- |
| `slash`   | Registered with Discord and used only as a slash command. |
| `message` | Used only through the configured message prefix.          |
| `hybrid`  | Available as both a slash and message command.            |

The default type is `hybrid`.

### Subcommands

Use spaces in the command name. Kyro compiles the path into Discord slash subcommands and matches the same path for message commands.

```ts
export default cmd({
  name: "prefix set",
  description: "Change the server prefix.",
  type: "hybrid",
  context: "guild",
  args: {
    prefix: { type: "string", description: "The new prefix.", required: true },
  },
  async run(ctx) {
    await savePrefix(ctx.guild!.id, ctx.string("prefix")!);
    await ctx.reply("The prefix has been updated.");
  },
});
```

### Arguments

Supported argument types are `string`, `number`, `boolean`, `user`, `role`, and `channel`.

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
    description: "How many times.",
    default: 1,
  },
}
```

Read arguments with the matching context method:

```ts
ctx.string("name");
ctx.number("amount");
ctx.boolean("enabled");
ctx.user("user");
ctx.role("role");
ctx.channel("channel");
```

Required arguments must appear before optional arguments. Choices and autocomplete are supported only by string and number arguments and cannot be enabled together.

### Autocomplete

```ts
export default cmd({
  name: "timezone set",
  description: "Set your timezone.",
  args: {
    timezone: {
      type: "string",
      description: "Your timezone.",
      required: true,
      autocomplete: true,
    },
  },
  autocomplete(ctx) {
    return findTimezones(ctx.focused).map((zone) => ({
      name: zone,
      value: zone,
    }));
  },
  async run(ctx) {
    // ...
  },
});
```

### Permissions and contexts

```ts
import { PermissionFlagsBits } from "discord.js";

export default cmd({
  name: "purge",
  description: "Delete recent messages.",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages],
  async run(ctx) {
    // ...
  },
});
```

`context` can be `guild`, `dms`, or `both`. Permission metadata requires a guild command.

### Localization

Commands, descriptions, arguments, and choices accept Discord.js localization maps:

```ts
nameLocalizations: { "es-ES": "perfil" },
descriptionLocalizations: { "es-ES": "Muestra tu perfil." },
```

### The command context

Every command receives a `Context`. Common properties and methods include:

- `ctx.author`, `ctx.guild`, `ctx.client`, `ctx.command`, and `ctx.prefix`
- `ctx.source`, `ctx.message`, and `ctx.interaction`
- `ctx.reply(content)` and `ctx.send(channel, content)`
- `ctx.showModal(modal)`, `ctx.collect()`, `ctx.update()` and `ctx.notice()`
- `ctx.server`, `ctx.mod`, `ctx.stats`, `ctx.music`, and `ctx.thread`
- `ctx.userStats()`, `ctx.roleStats()`, `ctx.channelStats()` and `ctx.emojiStats()`

Throw `UserError` for a safe message that should be shown to the user:

```ts
import { UserError } from "@lucvmf/kyro";

if (!ctx.guild) throw new UserError("This command only works in a server.");
```

## Middleware

Middleware wraps command execution. Call `next()` to continue.

```ts
import type { Middleware } from "@lucvmf/kyro";

const trackCommands: Middleware = async (ctx, next) => {
  const started = performance.now();
  try {
    await next();
  } finally {
    console.log(ctx.command.name, performance.now() - started);
  }
};

const bot = new Kyro({
  // ...
  middleware: [trackCommands],
});
```

## Events

Event files export `evt()` definitions. Event names and arguments are inferred from Discord.js.

```ts
// events/ready.ts
import { evt } from "@lucvmf/kyro";

export default evt({
  name: "clientReady",
  once: true,
  run(client) {
    console.log(`Logged in as ${client.user.username}`);
  },
});
```

Events support priority, async filters, and local error callbacks:

```ts
export default evt({
  name: "messageCreate",
  priority: 10,
  when: (message) => !message.author.bot,
  async run(message, kyro) {
    // ...
  },
  error(error, message) {
    console.error(`messageCreate failed for ${message.id}`, error);
  },
});
```

Higher-priority handlers run first. A `once` event is removed only after an event passes its `when` filter.

## Components

Component handlers work with buttons, string selects, and modal submissions. IDs can be strings or regular expressions.

```ts
// components/confirm.ts
import { cmp } from "@lucvmf/kyro";

export default cmp({
  id: /^confirm:(\d+)$/,
  context: "guild",
  cooldown: 2,
  async run(ctx) {
    const targetID = ctx.params[0];
    await ctx.update(`Confirmed ${targetID}.`);
  },
});
```

The component context provides:

- `ctx.id`, `ctx.params`, `ctx.values`, `ctx.user`, `ctx.guild`, and `ctx.server`
- `ctx.reply()`, `ctx.private()`, `ctx.update()`, `ctx.defer()`, and `ctx.showModal()`
- Modal readers: `field()`, `strings()`, `channelIds()`, `files()`, `radio()`, `checkbox()`, and `checks()`

Components support the same guild context and permission checks as commands.

## Embeds and Components V2

### Embeds

```ts
import { embed } from "@lucvmf/kyro";

await ctx.reply(
  embed({
    title: "Server information",
    description: "Everything is online.",
    color: "#5865f2",
    thumbnail: ctx.guild?.iconURL() ?? undefined,
    fields: [
      { name: "Members", value: String(ctx.guild?.memberCount), inline: true },
    ],
    timestamp: true,
  }),
);
```

The chainable API is also available:

```ts
embed().title("Result").desc("Done.").color("Green").footer("June").time();
```

### Containers

```ts
import { button, container, select, thumb } from "@lucvmf/kyro";

const card = container()
  .accent("#5865f2")
  .section("# Profile\nChoose an action below.", thumb(user.displayAvatarURL()))
  .separator()
  .row(
    button({ id: `profile:edit:${user.id}`, label: "Edit" }),
    button({ url: "https://example.com", label: "Website" }),
  )
  .row(
    select({
      id: "profile:section",
      placeholder: "Choose a section",
      options: [
        { label: "Overview", value: "overview" },
        { label: "History", value: "history" },
      ],
    }),
  );

await ctx.reply(card);
```

Containers support text, sections, thumbnails, buttons, selects, separators, galleries and file attachments.

### Modals

```ts
import { modal } from "@lucvmf/kyro";

await ctx.showModal(
  modal({
    id: "profile:edit",
    title: "Edit profile",
    inputs: [
      {
        id: "bio",
        label: "Biography",
        style: "paragraph",
        max: 500,
      },
      {
        type: "checkbox",
        id: "public",
        label: "Public profile",
        default: true,
      },
    ],
  }),
);
```

Kyro supports text fields, displayed text, string/user/role/channel/mentionable selects, file uploads, radio groups, checkboxes, and checkbox groups.

## Cached stores

`store()` combines async persistence with an in-memory TTL/LRU cache and deduplicates simultaneous reads.

```ts
import { store } from "@lucvmf/kyro";

const prefixes = store<string, string>({
  ttl: 60_000,
  max: 10_000,
  async load(guildID) {
    return (await readPrefix(guildID)) ?? ",";
  },
  async save(guildID, prefix) {
    await writePrefix(guildID, prefix);
  },
});

await prefixes.get(guildID);
await prefixes.set(guildID, "!");
await prefixes.update(guildID, () => "?");
prefixes.delete(guildID);
```

Use `prime()` to seed a value and `clear()` to invalidate the whole cache.

## PostgreSQL and Drizzle

Kyro can own a PostgreSQL connection and close it automatically during shutdown.

```ts
import { drizzle, Kyro } from "@lucvmf/kyro";
import * as schema from "./db/schema.ts";

const database = drizzle(process.env.DATABASE_URL!, { schema });

const bot = new Kyro({
  // ...
  database,
});

const rows = await database.db.query.users.findMany();
```

You remain responsible for defining the schema and running migrations.

## Plugins

```ts
import { plugin } from "@lucvmf/kyro";

const metrics = plugin({
  name: "metrics",
  version: "1.0.0",
  setup(kyro) {
    console.log(`Tracking ${kyro.client.user?.username ?? "bot"}`);
  },
  async stop() {
    await flushMetrics();
  },
});
```

Add the plugin object to `plugins`, or provide a directory containing default-exported plugins. Plugins load in order and stop in reverse order. If setup fails, Kyro rolls back plugins that already started.

## NodeLink music

Kyro includes an optional Moonlink/NodeLink music plugin.

```ts
import { Kyro, nodelink } from "@lucvmf/kyro";

const bot = new Kyro({
  // ...
  plugins: [
    nodelink({
      nodes: [
        {
          host: "127.0.0.1",
          port: 2333,
          password: "youshallnotpass",
          secure: false,
        },
      ],
    }),
  ],
});
```

Commands can then use `ctx.music`; the running framework exposes the same integration through `bot.music`.

## Lifecycle and shutdown

```ts
await bot.start();
await bot.reload();
await bot.stop();
```

`start()` loads commands, events, components and plugins before logging into Discord. After login, Kyro synchronizes slash commands according to `sync`.

`reload()` reloads file-based commands, events, components and plugins, then synchronizes commands again.

`stop()` runs `onStop`, detaches routers, unloads events and plugins, destroys the Discord client, and closes the configured database. Kyro automatically calls it on `SIGINT` and `SIGTERM`.

Use `onStop` for resources outside Kyro's ownership:

```ts
const bot = new Kyro({
  // ...
  async onStop() {
    await api.stop();
    await queue.close();
  },
});
```

## Error handling

Use `UserError` for expected input failures. Use `onError` for centralized logging and custom responses for unexpected failures.

```ts
const bot = new Kyro({
  // ...
  async onError(error, ctx) {
    console.error(`Command ${ctx.command.name} failed`, error);
    await ctx.reply("Something went wrong while running that command.");
  },
});
```

Components and events can define their own `error` callbacks close to the failing behavior.

## Framework utilities

Kyro also exports focused helpers for common Discord bot work:

- `duration`, `time`, and `unix` for time formatting
- `compact`, `fill`, `groups`, `mention`, and `codes` for text formatting
- `dominant` for extracting an image's dominant color
- `findRole` and `audit` for guild lookup and audit logs
- `BotProfile`, `GuildStats`, `ChannelStats`, `EmojiStats`, `RoleStats`, and `UserStats`
- `Cache`, `Store`, `Limit`, and `Shards`
- `CommandLoader`, `compileSlash`, `Registry`, and `Catalog` for advanced tooling

## Intents

Kyro validates the intents required by loaded commands:

- Message and hybrid guild commands require `GuildMessages` and `MessageContent`.
- Message and hybrid DM commands require `DirectMessages` and the `Channel` partial.
- Your events and features may require additional Discord intents.

Declare only the intents your bot actually uses.

## Development

```bash
bun install
bun run check
bun test
bun run build
```

Run formatting checks with:

```bash
bun run format:check
```

The test suite covers command registration and parsing, guards, middleware-facing behavior, events, components, UI, stores, music, plugins, status spoofing, shutdown, and the framework/package boundary.

## License

Kyro is available under the MIT License.
