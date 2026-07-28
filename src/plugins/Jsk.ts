import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";
import { cmd } from "../commands/Cmd.ts";
import { UserError } from "../commands/Errors.ts";
import { embed } from "../ui/Embed.ts";
import { container } from "../ui/Container.ts";
import { plugin } from "./Plugin.ts";
import { log } from "../core/Log.ts";

const exec = promisify(execFile);

export const jsk = plugin({
  name: "jishaku",
  version: "0.1.0",
  setup(kyro) {
    const owner = (ctx: { author: { id: string } }): boolean =>
      kyro.ownerIDs.includes(ctx.author.id);
    const guard = (ctx: { author: { id: string } }): boolean => owner(ctx);
    const add = (command: Parameters<typeof cmd>[0]) =>
      kyro.command(
        cmd({
          ...command,
          meta: { ...command.meta, help: false },
        }),
      );

    add({
      name: "jsk",
      description: "Show Jishaku tools",
      type: "message",
      run: (ctx) => {
        if (!guard(ctx)) return;
        const commands = kyro.commands.catalog.subs("jsk");
        return ctx.reply(
          container()
            .accent("#5865F2")
            .text(`## Jishaku\n-# ${commands.length} owner tools available`)
            .separator()
            .text(
              commands
                .map(
                  (command) =>
                    `**${ctx.prefix}${command.name}**\n-# ${command.description}`,
                )
                .join("\n\n"),
            ),
        );
      },
    });
    add({
      name: "jsk ping",
      description: "Show latency",
      type: "message",
      run: (ctx) => {
        if (!guard(ctx)) return;
        return ctx.reply(`WebSocket: **${ctx.client.ws.ping}ms**`);
      },
    });
    add({
      name: "jsk uptime",
      description: "Show uptime",
      type: "message",
      run: (ctx) => {
        if (!guard(ctx)) return;
        return ctx.reply(`Uptime: **${format(kyro.client.uptime)}**`);
      },
    });
    add({
      name: "jsk stats",
      description: "Show bot statistics",
      type: "message",
      run: (ctx) => {
        if (!guard(ctx)) return;
        return ctx.reply(
          embed()
            .title("Kyro Stats")
            .color("#5865F2")
            .field("Guilds", String(ctx.client.guilds.cache.size), true)
            .field("Users", String(ctx.client.users.cache.size), true)
            .field("Commands", String(kyro.commands.size), true)
            .field("WebSocket", `${ctx.client.ws.ping}ms`, true)
            .field("Uptime", format(kyro.client.uptime), true),
        );
      },
    });
    add({
      name: "jsk debug",
      description: "Show debug information",
      type: "message",
      run: (ctx) => {
        if (!guard(ctx)) return;
        return ctx.reply(
          `Kyro **${kyro.version}**\nCommands: **${kyro.commands.size}**\nErrors: **${log.errors}**`,
        );
      },
    });
    add({
      name: "jsk reload",
      description: "Reload Kyro files",
      type: "message",
      run: async (ctx) => {
        if (!guard(ctx)) return;
        await kyro.reload();
        await ctx.reply("Reloaded successfully.");
      },
    });
    add({
      name: "jsk shutdown",
      description: "Stop the bot",
      type: "message",
      run: async (ctx) => {
        if (!guard(ctx)) return;
        await ctx.reply("Shutting down.");
        await kyro.stop();
      },
    });
    add({
      name: "jsk eval",
      description: "Evaluate JavaScript",
      type: "message",
      args: {
        code: {
          type: "string",
          required: true,
          description: "JavaScript code",
        },
      },
      run: async (ctx) => {
        if (!guard(ctx)) return;
        const code = ctx.string("code")!;
        try {
          const result = await runInNewContext(
            code,
            { kyro, client: kyro.client },
            { timeout: 2_000 },
          );
          await ctx.reply(formatOutput(result));
        } catch (error) {
          await ctx.reply(`Error: ${String(error)}`);
        }
      },
    });
    add({
      name: "jsk exec",
      description: "Run a Node process",
      type: "message",
      args: {
        file: { type: "string", required: true, description: "Executable" },
        args: { type: "string", description: "Arguments" },
      },
      run: async (ctx) => {
        if (!guard(ctx)) return;
        try {
          const result = await exec(
            ctx.string("file")!,
            (ctx.string("args") ?? "").split(/\s+/).filter(Boolean),
            { timeout: 5_000, maxBuffer: 32_000 },
          );
          await ctx.reply(formatOutput(result.stdout || result.stderr));
        } catch (error) {
          await ctx.reply(`Error: ${String(error)}`);
        }
      },
    });
    add({
      name: "jsk sql",
      description: "Run a SQL query",
      type: "message",
      args: {
        query: { type: "string", required: true, description: "SQL query" },
      },
      run: async (ctx) => {
        if (!guard(ctx)) return;
        if (!kyro.db) throw new UserError("No Drizzle database is configured.");
        try {
          const { sql } = await import("drizzle-orm");
          const result = await kyro.db.db.execute(
            sql.raw(ctx.string("query")!),
          );
          await ctx.reply(formatOutput(result));
        } catch (error) {
          await ctx.reply(`Error: ${String(error)}`);
        }
      },
    });
  },
});

function format(value: number | null): string {
  if (value === null) return "Offline";
  const seconds = Math.floor(value / 1_000);
  return `${Math.floor(seconds / 3_600)}h ${Math.floor((seconds % 3_600) / 60)}m ${seconds % 60}s`;
}
function formatOutput(value: unknown): string {
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return `\`\`\`\n${(text ?? "undefined").slice(0, 1_800)}\n\`\`\``;
}
