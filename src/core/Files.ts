import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function scan(directory: string): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(`Directory "${directory}" does not exist.`);
    }

    throw error;
  }

  const files: string[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) files.push(...(await scan(path)));
    else if (entry.isFile() && isModule(entry.name)) files.push(path);
  }

  return files;
}

function isModule(name: string): boolean {
  return (
    /\.(?:[cm]?[jt]s)$/.test(name) &&
    !/\.(?:d|test|spec)\.(?:[cm]?[jt]s)$/.test(name)
  );
}
