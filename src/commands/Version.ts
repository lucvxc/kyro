import { cmd } from "./Cmd.ts";
import type { Kyro } from "../Kyro.ts";
import { log } from "../core/Log.ts";

export function version(kyro: Kyro): ReturnType<typeof cmd> {
  return cmd({
    name: "kyro version",
    description: "Show Kyro runtime information",
    type: "message",
    meta: { help: false },
    run: (ctx) =>
      ctx.reply(
        [
          `Kyro: **${kyro.version}**`,
          `Node: **${process.version}**`,
          `Guilds: **${kyro.client.guilds.cache.size}**`,
          `Commands: **${kyro.commands.size}**`,
          `Errors: **${log.errors}**`,
        ].join("\n"),
      ),
  });
}
