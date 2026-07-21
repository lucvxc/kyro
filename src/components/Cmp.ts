import type {
  ButtonInteraction,
  Client,
  Interaction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  PermissionResolvable,
} from "discord.js";
import type { Container } from "../ui/Container.ts";
import type { Embed } from "../ui/Embed.ts";
import type { Server } from "../guild/Server.ts";

export type ComponentInput = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;
export type ComponentReply = string | Embed | Container;
export type ComponentId = string | RegExp;

export interface CmpContext {
  readonly client: Client;
  readonly interaction: ComponentInput;
  readonly id: string;
  readonly user: ComponentInput["user"];
  readonly guild: ComponentInput["guild"];
  readonly server: Server;
  readonly values: readonly string[];
  readonly params: readonly string[];
  field(name: string): string | null;
  strings(name: string): readonly string[];
  files(name: string): readonly import("discord.js").Attachment[];
  radio(name: string): string | null;
  checkbox(name: string): boolean | null;
  checks(name: string): readonly string[];
  showModal(modal: import("discord.js").ModalBuilder): Promise<void>;
  reply(content: ComponentReply): Promise<void>;
  private(content: ComponentReply): Promise<void>;
  update(content: ComponentReply): Promise<void>;
  defer(): Promise<void>;
}

export interface Cmp {
  id: ComponentId;
  permissions?: readonly PermissionResolvable[];
  context?: "both" | "guild" | "dms";
  cooldown?: number;
  run(ctx: CmpContext): void | Promise<void>;
  error?(error: unknown, ctx: CmpContext): void | Promise<void>;
}

export function cmp(value: Cmp): Cmp {
  if (!value?.id || (typeof value.id === "string" && !value.id.trim()) || typeof value.run !== "function") {
    throw new TypeError("A component needs an id and run function.");
  }
  return value;
}

export function isComponentInteraction(value: Interaction): value is ComponentInput {
  return value.isButton() || value.isAnySelectMenu() || value.isModalSubmit();
}
