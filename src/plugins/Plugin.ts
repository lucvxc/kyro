import type { Kyro } from "../Kyro.ts";

export interface Plugin {
  name: string;
  version?: string;
  setup(kyro: Kyro): void | Promise<void>;
  stop?(kyro: Kyro): void | Promise<void>;
}

export function plugin(value: Plugin): Plugin {
  if (!value?.name?.trim() || typeof value.setup !== "function") throw new TypeError("A plugin needs a name and setup function.");
  return value;
}
