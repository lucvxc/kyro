# Kyro

Kyro is a Discord.js framework for commands, events, components, modals, autocomplete, and Drizzle PostgreSQL databases.

## Quick start

```ts
import { GatewayIntentBits } from "discord.js";
import { Kyro } from "@lucvmf/kyro";

const bot = new Kyro({
  token: process.env.TOKEN!,
  appID: process.env.CLIENTID!,
  intents: [GatewayIntentBits.Guilds],
  commands: "./commands",
});

await bot.start();
```

Features such as databases, custom permission resolution, reply formatting, and
plugins are optional. Add only what your bot needs.

## NodeLink music

Enable the optional music plugin by adding `nodelink(...)` to `plugins`. Music
commands use the guild-scoped player directly from their context:

```ts
run: ctx => ctx.music.play(ctx.string("query")!)
```

Available controls include `play`, `pause`, `resume`, `skip`, `stop`, `volume`, `seek`, `shuffle`, and `loop`. The plugin handles queues, playlists, voice updates, session resuming, empty-channel cleanup, multiple nodes, and shard-aware voice connections.

```bash
bun install
bun run bot
```

Run database migrations with:

```bash
bun run db:generate
bun run db:migrate
```

Development checks:

```bash
bun test
bun run check
bun run build
```
