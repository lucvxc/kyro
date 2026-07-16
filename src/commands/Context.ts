import { MessageFlags } from "discord.js";
import type { ModalBuilder } from "discord.js";
import type {
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildBasedChannel,
  Message,
  MessageComponentInteraction,
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
import { Stats } from "../core/Stats.ts";
import { withStats, type GuildWithStats } from "../guild/Stats.ts";
import { ChannelStats } from "../guild/ChannelStats.ts";
import { EmojiStats } from "../guild/EmojiStats.ts";
import { RoleStats } from "../guild/RoleStats.ts";
import { UserStats } from "../guild/UserStats.ts";
import { UserError } from "./Errors.ts";
import { Catalog } from "./Catalog.ts";
import { musicFor, type MusicContext } from "../plugins/music/index.ts";
import { findRole } from "../guild/Lookup.ts";

const mentions = { parse: [] as never[], repliedUser: false };

export type Source = "slash" | "message";
export type Input = ChatInputCommandInteraction | Message;

export type Reply = string | Embed | Container;

export class Context {
  public readonly client: Client;
  public readonly issue: string | undefined;
  readonly #entry: Entry;
  readonly #values: ReadonlyMap<string, unknown>;
  readonly #guild: GuildWithStats | null;
  #mod: Moderation | undefined;
  #server: Server | undefined;
  #stats: Stats | undefined;
  #response: Message | undefined;

  public constructor(
    public readonly source: Source,
    public readonly input: Input,
    entry: Entry,
    public readonly raw: readonly string[] = [],
    public readonly commands: Catalog = new Catalog([]),
    public readonly prefix = "/",
  ) {
    this.client = input.client;
    this.#entry = entry;
    this.#guild = input.guild ? withStats(input.guild) : null;

    if (source === "message") {
      const message = input as Message;
      const parsed = parse(entry.args, raw, {
        user: (id) => message.mentions.users.get(id) ?? message.client.users.cache.get(id),
        role: value => message.guild ? findRole(message.guild, value) : undefined,
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

  public get guild(): GuildWithStats | null {
    return this.#guild;
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
    return this.#mod ??= new Moderation(this.client, this.guild, this.author);
  }
  public get server(): Server {
    if (!this.guild) throw new Error("This action can only be used in a server.");
    return this.#server ??= new Server(this.guild);
  }
  public get stats(): Stats { return this.#stats ??= new Stats(this.client); }
  public get music(): MusicContext {
    const music = musicFor(this.client);
    if (!music) throw new UserError("The NodeLink music plugin is not enabled.");
    return music.context(this);
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

  public role(name: string): Role | null {
    this.#check(name, "role");
    if (this.source === "message") return (this.#values.get(name) as Role | undefined) ?? null;
    const selected = (this.input as ChatInputCommandInteraction).options.getRole(name);
    return selected ? this.guild?.roles.cache.get(selected.id) ?? null : null;
  }

  public channel(name: string): GuildBasedChannel | null {
    this.#check(name, "channel");
    if (this.source === "message") return (this.#values.get(name) as GuildBasedChannel | undefined) ?? null;
    const selected = (this.input as ChatInputCommandInteraction).options.getChannel(name);
    return selected ? this.guild?.channels.cache.get(selected.id) ?? null : null;
  }

  public channelStats(name: string): ChannelStats {
    const selected = this.channel(name);
    const channel = this.guild?.channels.cache.get(selected?.id ?? this.input.channelId);
    if (!channel) throw new UserError("I could not find that channel.");
    return new ChannelStats(channel);
  }

  public async emojiStats(name: string): Promise<EmojiStats> {
    const input = this.string(name)!;
    const id = input.match(/\d{17,20}/)?.[0];
    const key = input.replace(/^:|:$/g, "").toLowerCase();
    let emoji = this.guild?.emojis.cache.get(id ?? "") ?? this.guild?.emojis.cache.find(value => value.name?.toLowerCase() === key);
    if (!emoji && this.guild) {
      await this.guild.emojis.fetch();
      emoji = this.guild.emojis.cache.get(id ?? "") ?? this.guild.emojis.cache.find(value => value.name?.toLowerCase() === key);
    }
    if (!emoji) throw new UserError("I could not find that emoji in this server.");
    return new EmojiStats(emoji);
  }

  public roleStats(name: string): RoleStats {
    const selected = this.role(name);
    const role = this.guild?.roles.cache.get(selected?.id ?? "") ?? this.guild?.roles.everyone;
    if (!role) throw new UserError("I could not find that role.");
    return new RoleStats(role);
  }

  public async userStats(name: string, fresh = false): Promise<UserStats> {
    const selected = this.user(name) ?? this.author;
    const user = fresh ? await this.client.users.fetch(selected.id, { force: true }) : selected;
    const member = this.guild
      ? this.guild.members.cache.get(user.id) ?? await this.guild.members.fetch(user.id).catch(() => null)
      : null;
    return new UserStats(user, member);
  }

  public async ownerStats(): Promise<UserStats> {
    if (!this.guild) throw new UserError("This command can only be used in a server.");
    const user = await this.client.users.fetch(this.guild.ownerId, { force: true });
    const member = this.guild.members.cache.get(user.id) ?? await this.guild.members.fetch(user.id).catch(() => null);
    return new UserStats(user, member);
  }

  public async reply(content: Reply): Promise<void> {
    const options = replyOptions(content);

    if (this.source === "message") {
      this.#response = await (this.input as Message).reply(options as never);
      return;
    }

    const interaction = this.input as ChatInputCommandInteraction;

    if (interaction.replied || interaction.deferred) {
      this.#response = await interaction.followUp(options as never);
      return;
    }

    await interaction.reply(options as never);
    this.#response = await interaction.fetchReply();
  }

  public async showModal(modal: ModalBuilder): Promise<void> {
    if (!this.interaction) throw new Error("Modals can only be opened from slash commands.");
    await this.interaction.showModal(modal);
  }

  public async collect(options: object = {}) {
    const message = this.#response ?? await this.inputInteraction().fetchReply();
    return message.createMessageComponentCollector(options as never);
  }

  public async update(interaction: MessageComponentInteraction, content: Reply): Promise<void> {
    await interaction.update(replyOptions(content) as never);
  }

  public async notice(interaction: MessageComponentInteraction, content: string): Promise<void> {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: mentions });
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

export function replyOptions(value: Reply): object {
  if (typeof value === "string") return { content: value, allowedMentions: mentions };
  if (value.kind === "embed") {
    return { embeds: [value.toJSON()], allowedMentions: mentions };
  }

  return {
    components: [value.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    files: value.files,
    allowedMentions: mentions,
  };
}
