import type { Catalog, Context } from "../../index.ts";
import {
  cmd,
  container,
  dominant,
  select,
  thumb,
  UserError,
} from "../../index.ts";

export default cmd({
  name: "help",
  description: "Browse available commands.",
  type: "hybrid",
  aliases: ["h"],
  syntax: "help (command)",
  example: "help avatar",
  meta: { help: false },
  args: {
    command: { type: "string", description: "The command to look up" },
  },
  run: async (ctx) => {
    const catalog = ctx.commands.visible;
    const avatar = ctx.stats.avatar();
    const accent = await dominant(avatar);
    const query = ctx.string("command")?.trim();
    if (query) return ctx.reply(command(catalog, query, ctx.prefix, accent));

    const picker = select({
      id: "help-category",
      placeholder: "Select a category",
      options: [
        { label: "Home", value: "home" },
        ...catalog.categories.slice(0, 24).map((category) => ({
          label: category.label,
          value: category.name,
          description: `${category.commands.length} commands`,
        })),
      ],
    });

    await ctx.reply(home(ctx, catalog, picker, avatar, accent));
    const collector = await ctx.collect({ time: 300_000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.user.id !== ctx.author.id) {
        return ctx.notice(interaction, "This isn't your menu buddy.");
      }

      const selected = interaction.values[0] ?? "home";
      await ctx.update(
        interaction,
        selected === "home"
          ? home(ctx, catalog, picker, avatar, accent)
          : category(catalog, selected, picker, accent),
      );
    });
  },
});

function home(
  ctx: Context,
  catalog: Catalog,
  picker: ReturnType<typeof select>,
  avatar: string,
  accent: string,
) {
  return container()
    .accent(accent)
    .section(
      `## ${ctx.stats.name} Help\n-# Browse ${catalog.commands.length} commands across ${catalog.categories.length} categories.`,
      thumb(avatar),
    )
    .separator()
    .text("`*` has subcommands")
    .row(picker);
}

function command(
  catalog: Catalog,
  query: string,
  prefix: string,
  accent: string,
) {
  const found = catalog.find(query);
  const subs = catalog.subs(found ?? query);
  if (!found && !subs.length)
    throw new UserError(`No command found for "${query}".`);

  if (!found) {
    return container()
      .accent(accent)
      .text(`## ${query}\n-# ${subs.length} subcommands`)
      .separator()
      .text(
        subs
          .map((item) => `**${prefix}${item.syntax}**\n-# ${item.description}`)
          .join("\n\n"),
      );
  }

  const card = container()
    .accent(accent)
    .text(`## ${found.name}\n-# ${found.description}`)
    .separator()
    .text(
      [
        `**Syntax** \`${prefix}${found.syntax}\``,
        found.example ? `**Example** \`${prefix}${found.example}\`` : "",
        found.aliases.length
          ? `**Aliases** ${found.aliases.map((alias) => `\`${alias}\``).join(" · ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

  if (subs.length)
    card.text(
      `**Subcommands**\n${subs.map((item) => `\`${item.name}\``).join(" · ")}`,
    );
  return card;
}

function category(
  catalog: Catalog,
  name: string,
  picker: ReturnType<typeof select>,
  accent: string,
) {
  const found = catalog.category(name);
  if (!found) throw new UserError("That command category no longer exists.");

  const commands = found.roots
    .map((root) => `${root}${catalog.hasSubs(root) ? "*" : ""}`)
    .join(", ");

  return container()
    .accent(accent)
    .text(`## ${found.label} Commands\n-# ${found.commands.length} commands`)
    .separator()
    .text(`\`\`\`\n${commands || "No commands in this category."}\n\`\`\``)
    .row(picker);
}
