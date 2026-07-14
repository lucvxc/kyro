import { MessageFlags } from "discord.js";
import type { ComponentInput, ComponentReply } from "./Cmp.ts";

export class ComponentContext {
  public readonly client;

  public constructor(
    public readonly interaction: ComponentInput,
    public readonly id: string,
  ) {
    this.client = interaction.client;
  }

  public get user() { return this.interaction.user; }
  public get guild() { return this.interaction.guild; }
  public get values(): readonly string[] {
    return "values" in this.interaction ? this.interaction.values : [];
  }
  public get params(): readonly string[] { return this.id.split(":").slice(1); }
  public field(name: string): string | null {
    return this.interaction.isModalSubmit() ? this.interaction.fields.getTextInputValue(name) || null : null;
  }
  public showModal(modal: import("discord.js").ModalBuilder): Promise<void> {
    if (!this.interaction.isButton()) throw new Error("Only buttons can show modals.");
    return this.interaction.showModal(modal).then(() => undefined);
  }

  public reply(content: ComponentReply): Promise<void> {
    return this.interaction.reply(toReply(content) as never).then(() => undefined);
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

function toReply(value: ComponentReply): object {
  if (typeof value === "string") return { content: value };
  if (value.kind === "embed") return { embeds: [value.toJSON()] };
  return { components: [value.toJSON()], flags: MessageFlags.IsComponentsV2, files: value.files };
}
