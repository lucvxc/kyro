import { embed } from "../ui/Embed.ts";
import type { Cmd } from "./Cmd.ts";
import type { Registry } from "./Registry.ts";

export function help(registry: Registry): Cmd {
  return {
    name: "help",
    description: "Show available commands",
    type: "hybrid",
    aliases: ["h"],
    args: { command: { type: "string", description: "Command to look up" } },
    run: (ctx) => {
      const query = ctx.string("command")?.trim().toLowerCase();
      const commands = registry.values().filter(command => command.name !== "help");
      const selected = query
        ? commands.find(command => command.name === query || command.aliases.includes(query))
        : undefined;

      if (query && !selected) return ctx.reply(`I couldn't find a command named "${query}".`);

      const card = embed()
        .title(selected ? `/${selected.name}` : "Kyro Help")
        .desc(selected ? selected.description : "Use `/help <command>` to see details about a command.")
        .color("#5865F2")
        .footer(selected ? "Kyro command help" : `${commands.length} commands available`)
        .time();

      if (selected) {
        const args = Object.entries(selected.args ?? {})
          .map(([name, arg]) => `• \`${name}\` - ${arg.description ?? "No description"}${arg.required ? " **required**" : ""}`)
          .join("\n");
        const usage = `\`/${selected.name}${Object.keys(selected.args ?? {}).map(name => ` <${name}>`).join("")}\``;
        card.field("Usage", usage);
        if (args) card.field("Arguments", args);
        if (selected.aliases.length) card.field("Aliases", selected.aliases.map(alias => `\`${alias}\``).join("  ·  "));
      } else {
        const list = commands.slice(0, 25).map(command => {
          const aliases = command.aliases.length
            ? `  ·  *${command.aliases.map(alias => `\`${alias}\``).join(" ")}*`
            : "";
          return `**/${command.name}**${aliases}\n${command.description}`;
        }).join("\n\n");
        card.field("Commands", list || "No commands registered.");
      }

      return ctx.reply(card);
    },
  };
}
