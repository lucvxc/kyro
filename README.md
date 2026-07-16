# Kyro

Kyro is a Discord.js framework for commands, events, components, modals, autocomplete, and Drizzle PostgreSQL databases.

## NodeLink music

Enable the built-in music plugin with a NodeLink v4 server:

```ts
import { GatewayIntentBits } from "discord.js";
import { Kyro, nodelink } from "@lucvmf/kyro";

const bot = new Kyro({
  client: {
    token: process.env.TOKEN!,
    appID: process.env.ID!,
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  },
  config: {
    plugins: [nodelink({
      nodes: [{
        host: process.env.NODELINK_HOST!,
        password: process.env.NODELINK_PASSWORD!,
        secure: process.env.NODELINK_SECURE !== "false",
      }],
    })],
  },
});
```

Music commands use the guild-scoped player directly from their context:

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
