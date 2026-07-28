import type { Entry } from "./Cmd.ts";

export interface Category {
  name: string;
  label: string;
  commands: readonly Entry[];
  roots: readonly string[];
}

export class Catalog {
  public readonly commands: readonly Entry[];
  public readonly categories: readonly Category[];
  #visible: Catalog | undefined;

  public constructor(commands: readonly Entry[]) {
    this.commands = Object.freeze([...commands].sort(byName));
    const grouped = new Map<string, Entry[]>();

    for (const command of this.commands) {
      const values = grouped.get(command.category) ?? [];
      values.push(command);
      grouped.set(command.category, values);
    }

    this.categories = Object.freeze(
      [...grouped]
        .map(([name, values]) =>
          Object.freeze({
            name,
            label: label(name),
            commands: Object.freeze(values),
            roots: Object.freeze([
              ...new Set(values.map((command) => command.path[0]!)),
            ]),
          }),
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    );
  }

  public find(query: string): Entry | undefined {
    const name = clean(query);
    return this.commands.find(
      (command) => command.name === name || command.aliases.includes(name),
    );
  }

  public get visible(): Catalog {
    return (this.#visible ??= new Catalog(
      this.commands.filter((command) => command.meta?.help !== false),
    ));
  }

  public category(name: string): Category | undefined {
    const value = clean(name);
    return this.categories.find((category) => category.name === value);
  }

  public subs(command: string | Entry): readonly Entry[] {
    const name = typeof command === "string" ? clean(command) : command.name;
    return this.commands.filter((value) => value.name.startsWith(`${name} `));
  }

  public hasSubs(command: string | Entry): boolean {
    return this.subs(command).length > 1;
  }
}

function clean(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
function label(value: string): string {
  return value
    .split(/[-_]/)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
function byName(a: Entry, b: Entry): number {
  return a.name.localeCompare(b.name);
}
