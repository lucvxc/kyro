import {
  InteractionTypes,
  type Attachment,
  type InteractionCallbackData,
} from "discordeno";
import type { ComponentInput, ComponentReply } from "./Cmp.ts";
import { messageOptions } from "../ui/Message.ts";
import type { MessagePolicy } from "../ui/Message.ts";
import { Services, type ServiceToken } from "../core/Services.ts";

export class ComponentContext {
  public readonly client;
  #deferredReply = false;

  public constructor(
    public readonly interaction: ComponentInput,
    public readonly id: string,
    public readonly params: readonly string[] = id.split(":").slice(1),
    public readonly services: Services = new Services(),
    public readonly signal: AbortSignal = new AbortController().signal,
    public readonly messagePolicy: MessagePolicy = {},
  ) {
    this.client = interaction.bot;
  }

  public get user() {
    return this.interaction.user;
  }
  public get guild() {
    return this.interaction.guildId ? this.interaction.guild : null;
  }
  public get values(): readonly string[] {
    return this.interaction.data?.values?.map(String) ?? [];
  }
  public field(name: string): string | null {
    return this.valuesFor(name)[0] ?? null;
  }
  public strings(name: string): readonly string[] {
    return this.valuesFor(name);
  }
  public channelIds(name: string): readonly string[] {
    return this.valuesFor(name);
  }
  public files(name: string): readonly Attachment[] {
    const resolved = this.interaction.data?.resolved?.attachments;
    return this.valuesFor(name).flatMap((id) => {
      const file = resolved?.get(BigInt(id));
      return file ? [file] : [];
    });
  }
  public showModal(modal: InteractionCallbackData): Promise<void> {
    if (this.interaction.type !== InteractionTypes.MessageComponent)
      throw new Error("Only buttons and selects can show modals.");
    return this.interaction.respond(modal).then(() => undefined);
  }
  public reply(content: ComponentReply): Promise<void> {
    if (this.#deferredReply) {
      this.#deferredReply = false;
      return this.interaction
        .edit(messageOptions(content, false, this.messagePolicy))
        .then(() => undefined);
    }
    return this.interaction
      .respond(messageOptions(content, false, this.messagePolicy))
      .then(() => undefined);
  }
  public private(content: ComponentReply): Promise<void> {
    return this.interaction
      .respond(messageOptions(content, true, this.messagePolicy), {
        isPrivate: true,
      })
      .then(() => undefined);
  }
  public update(content: ComponentReply): Promise<void> {
    if (this.interaction.type !== InteractionTypes.MessageComponent)
      throw new Error("Only buttons and selects can update their message.");
    return this.interaction
      .edit(messageOptions(content, false, this.messagePolicy))
      .then(() => undefined);
  }
  public defer(): Promise<void> {
    return this.interaction.deferEdit().then(() => undefined);
  }
  public deferReply(privateResponse = false): Promise<void> {
    this.#deferredReply = true;
    return this.interaction.defer(privateResponse).then(() => undefined);
  }
  public followUp(
    content: ComponentReply,
    privateResponse = false,
  ): Promise<void> {
    return this.interaction
      .respond(messageOptions(content, privateResponse, this.messagePolicy), {
        isPrivate: privateResponse,
      })
      .then(() => undefined);
  }
  public deleteReply(messageId?: bigint): Promise<void> {
    return this.interaction.delete(messageId);
  }
  public service<T>(token: ServiceToken<T>): T {
    return this.services.get(token);
  }

  private valuesFor(name: string): string[] {
    for (const row of this.interaction.data?.components ?? []) {
      for (const component of componentChildren(
        row as unknown as ComponentData,
      )) {
        if (component.customId === name)
          return (
            component.values ??
            (component.value === undefined ? [] : [component.value])
          ).map(String);
      }
    }
    return [];
  }
}

interface ComponentData {
  customId?: string;
  value?: string;
  values?: (string | bigint)[];
  component?: ComponentData;
  components?: (ComponentData | undefined)[];
}
function componentChildren(
  component: ComponentData | undefined,
): ComponentData[] {
  if (!component) return [];
  const children = [
    ...(component.components ?? []),
    ...(component.component ? [component.component] : []),
  ];
  return children.length ? children.flatMap(componentChildren) : [component];
}
