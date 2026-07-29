#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Loader } from "./commands/Loader.ts";
import { Registry } from "./commands/Registry.ts";
import { compileSlash } from "./commands/Compiler.ts";
import type { Kyro } from "./Kyro.ts";

const [, , command, ...args] = process.argv;

if (command === "validate") {
  const directory = resolve(args[0] ?? "src/commands");
  const registry = new Registry();
  await new Loader(registry, directory).load();
  compileSlash(registry.values());
  console.info(`Valid: ${registry.size} commands in ${directory}`);
} else if (command === "commands" && ["diff", "sync"].includes(args[0] ?? "")) {
  const operation = args[0]!;
  const modulePath = resolve(args[1] ?? "src/kyro.ts");
  const loaded = (await import(pathToFileURL(modulePath).href)) as {
    default?: Kyro;
  };
  if (!loaded.default)
    throw new Error(`${modulePath} must default-export a Kyro instance.`);
  if (operation === "diff") console.table(await loaded.default.commandDiff());
  else {
    await loaded.default.syncCommands();
    console.info("Application commands synchronized.");
  }
} else if (command === "generate") {
  const kind = args[0];
  const name = args[1];
  if (!kind || !name || !["command", "event", "component"].includes(kind))
    usage();
  const folder = kind === "command" ? "commands" : `${kind}s`;
  const file = resolve("src", folder, `${name}.ts`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, template(kind, name), { flag: "wx" });
  console.info(`Created ${file}`);
} else usage();

function usage(): never {
  console.info("kyro validate [commands-directory]");
  console.info("kyro commands diff [kyro-module]");
  console.info("kyro commands sync [kyro-module]");
  console.info("kyro generate <command|event|component> <name>");
  process.exit(1);
}

function template(kind: string, name: string): string {
  if (kind === "event")
    return `import { evt } from "@lucvmf/kyro";\n\nexport default evt({\n  name: "ready",\n  run(payload) {\n    console.info(payload);\n  },\n});\n`;
  if (kind === "component")
    return `import { cmp } from "@lucvmf/kyro";\n\nexport default cmp({\n  id: "${name.replaceAll("/", ":")}",\n  run: (ctx) => ctx.reply("Done."),\n});\n`;
  const route = name.replaceAll("/", " ");
  return `import { cmd } from "@lucvmf/kyro";\n\nexport default cmd({\n  name: "${route}",\n  description: "TODO",\n  run: (ctx) => ctx.reply("Done."),\n});\n`;
}
