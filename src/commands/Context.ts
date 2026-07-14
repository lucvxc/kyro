import { MessageFlags } from "discord.js";
import type { ModalBuilder } from "discord.js";
import type {
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildBasedChannel,
  Message,
  Role,
  User,
} from "discord.js";

import type { ArgType } from "./Arg.ts";
import type { Entry } from "./Cmd.ts";
import { parse } from "./Parser.ts";
import type { Container } from "../ui/Container.ts";
import type { Embed } from "../ui/Embed.ts";
import { Moderation } from "./Moderation.ts";
import { Server } from "../guild/Server.ts";

export type Source = "slash" | "message";
export type Input = ChatInputCommandInteraction | Message;

type SlashOptions = ChatInputCommandInteraction["options"];
type RoleValue = ReturnType<SlashOptions["getRole"]>;
type ChannelValue = ReturnType<SlashOptions["getChannel"]>;
export type Reply = string | Embed | Container;

export class Context {
  public readonly client: Client;
  public readonly issue: string | undefined;
  readonly #entry: Entry;
  readonly #values: ReadonlyMap<string, unknown>;

  public constructor(
    public readonly source: Source,
    public readonly input: Input,
    entry: Entry,
    public readonly raw: readonly string[] = [],
  ) {
    this.client = input.client;
    this.#entry = entry;

    if (source === "message") {
      const message = input as Message;
      const parsed = parse(entry.args, raw, {
        user: (id) => message.mentions.users.get(id) ?? message.client.users.cache.get(id),
        role: (id) => message.mentions.roles.get(id) ?? message.guild?.roles.cache.get(id),
        channel: (id) => message.guild?.channels.cache.get(id),
      });

      this.#values = parsed.values;
      this.issue = parsed.issue;
    } else {
      this.#values = new Map();
      this.issue = undefined;
    }
  }

  public get author(): User {
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).user
      : (this.input as Message).author;
  }
  public get command(): Entry { return this.#entry; }

  public get guild(): Guild | null {
    return this.input.guild;
  }

  public get interaction(): ChatInputCommandInteraction | null {
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction)
      : null;
  }

  public get message(): Message | null {
    return this.source === "message" ? (this.input as Message) : null;
  }
  public get mod(): Moderation {
    return new Moderation(this.client, this.guild, this.author);
  }
  public get server(): Server {
    if (!this.guild) throw new Error("This action can only be used in a server.");
    return new Server(this.guild);
  }

  public string(name: string): string | null {
    this.#check(name, "string");
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).options.getString(name) ?? (this.#entry.args?.[name]?.default as string | undefined) ?? null
      : (this.#values.get(name) as string | undefined) ?? null;
  }

  public number(name: string): number | null {
    this.#check(name, "number");
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).options.getNumber(name) ?? (this.#entry.args?.[name]?.default as number | undefined) ?? null
      : (this.#values.get(name) as number | undefined) ?? null;
  }

  public boolean(name: string): boolean | null {
    this.#check(name, "boolean");
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).options.getBoolean(name) ?? (this.#entry.args?.[name]?.default as boolean | undefined) ?? null
      : (this.#values.get(name) as boolean | undefined) ?? null;
  }

  public user(name: string): User | null {
    this.#check(name, "user");
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).options.getUser(name)
      : (this.#values.get(name) as User | undefined) ?? null;
  }

  public role(name: string): RoleValue {
    this.#check(name, "role");
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).options.getRole(name)
      : ((this.#values.get(name) as Role | undefined) ?? null);
  }

  public channel(name: string): ChannelValue {
    this.#check(name, "channel");
    return this.source === "slash"
      ? (this.input as ChatInputCommandInteraction).options.getChannel(name)
      : ((this.#values.get(name) as GuildBasedChannel | undefined) ?? null);
  }

  public async reply(content: Reply): Promise<void> {
    const options = typeof content === "string" ? content : toReply(content);

    if (this.source === "message") {
      await (this.input as Message).reply(options as never);
      return;
    }

    const interaction = this.input as ChatInputCommandInteraction;

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(options as never);
      return;
    }

    await interaction.reply(options as never);
  }

  public async showModal(modal: ModalBuilder): Promise<void> {
    if (!this.interaction) throw new Error("Modals can only be opened from slash commands.");
    await this.interaction.showModal(modal);
  }

  public async collect(options: object = {}) {
    const message = this.message ?? await this.inputInteraction().fetchReply();
    return message.createMessageComponentCollector(options as never);
  }

  private inputInteraction(): ChatInputCommandInteraction {
    if (!this.interaction) throw new Error("Collectors require an interaction or message context.");
    return this.interaction;
  }

  #check(name: string, type: ArgType): void {
    const arg = this.#entry.args?.[name];

    if (!arg) throw new Error(`Argument "${name}" is not defined.`);
    if (arg.type !== type) {
      throw new TypeError(`Argument "${name}" is ${arg.type}, not ${type}.`);
    }
  }
}

function toReply(value: Embed | Container): object {
  if (value.kind === "embed") {
    return { embeds: [value.toJSON()] };
  }

  return {
    components: [value.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    files: value.files,
  };
}
