import { MessageFlags } from "discord.js";
import type { ComponentInput, ComponentReply } from "./Cmp.ts";
import { Server } from "../guild/Server.ts";

export class ComponentContext {
  public readonly client;
  #server: Server | undefined;

  public constructor(
    public readonly interaction: ComponentInput,
    public readonly id: string,
  ) {
    this.client = interaction.client;
  }

  public get user() { return this.interaction.user; }
  public get guild() { return this.interaction.guild; }
  public get server(): Server {
    if (!this.guild) throw new Error("This action can only be used in a server.");
    return this.#server ??= new Server(this.guild);
  }
  public get values(): readonly string[] {
    return "values" in this.interaction ? this.interaction.values : [];
  }
  public get params(): readonly string[] { return this.id.split(":").slice(1); }
  public field(name: string): string | null {
    if (!this.interaction.isModalSubmit()) return null;
    const interaction = this.interaction;
    return safe(() => interaction.fields.getTextInputValue(name) || null, null);
  }
  public strings(name: string): readonly string[] {
    if (!this.interaction.isModalSubmit()) return [];
    const interaction = this.interaction;
    return safe(() => interaction.fields.getStringSelectValues(name), []);
  }
  public files(name: string): readonly import("discord.js").Attachment[] {
    if (!this.interaction.isModalSubmit()) return [];
    const interaction = this.interaction;
    const files = safe(() => interaction.fields.getUploadedFiles(name), null);
    return files ? [...files.values()] : [];
  }
  public radio(name: string): string | null {
    if (!this.interaction.isModalSubmit()) return null;
    const interaction = this.interaction;
    return safe(() => interaction.fields.getRadioGroup(name), null);
  }
  public checkbox(name: string): boolean | null {
    if (!this.interaction.isModalSubmit()) return null;
    const interaction = this.interaction;
    return safe(() => interaction.fields.getCheckbox(name), null);
  }
  public checks(name: string): readonly string[] {
    if (!this.interaction.isModalSubmit()) return [];
    const interaction = this.interaction;
    return safe(() => interaction.fields.getCheckboxGroup(name), []);
  }
  public showModal(modal: import("discord.js").ModalBuilder): Promise<void> {
    if (!this.interaction.isButton()) throw new Error("Only buttons can show modals.");
    return this.interaction.showModal(modal).then(() => undefined);
  }

  public reply(content: ComponentReply): Promise<void> {
    return this.interaction.reply(toReply(content) as never).then(() => undefined);
  }

  public private(content: ComponentReply): Promise<void> {
    return this.interaction.reply(toReply(content, true) as never).then(() => undefined);
  }

  public update(content: ComponentReply): Promise<void> {
    if (!this.interaction.isMessageComponent()) {
      throw new Error("Only buttons and selects can update their message.");
    }
    return this.interaction.update(toReply(content) as never).then(() => undefined);
  }

  public defer(): Promise<void> {
    return this.interaction.deferUpdate().then(() => undefined);
  }
}

function safe<T>(run: () => T, fallback: T): T {
  try { return run(); } catch { return fallback; }
}

function toReply(value: ComponentReply, ephemeral = false): object {
  const privateFlag = ephemeral ? MessageFlags.Ephemeral : undefined;
  if (typeof value === "string") return { content: value, flags: privateFlag };
  if (value.kind === "embed") return { embeds: [value.toJSON()], flags: privateFlag };
  return {
    components: [value.toJSON()],
    flags: ephemeral
      ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      : MessageFlags.IsComponentsV2,
    files: value.files,
  };
}
