import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildBasedChannel,
  type GuildMember,
  type Message,
  type Role,
  type User,
} from "discord.js";
import { UserError } from "../commands/Errors.ts";

type Target = User | string;

export class Server {
  public readonly roles: Roles;
  public readonly members: Members;
  public readonly channels: Channels;
  public readonly threads: Threads;
  public readonly permissions: Permissions;
  public readonly settings: Settings;

  public constructor(public readonly guild: Guild) {
    this.roles = new Roles(guild);
    this.members = new Members(guild);
    this.channels = new Channels(guild);
    this.threads = new Threads(guild);
    this.permissions = new Permissions(guild);
    this.settings = new Settings(guild);
  }
}

class Roles {
  public constructor(private readonly guild: Guild) {}
  public async add(target: Target, role: Role | string, reason?: string): Promise<GuildMember> { const member = await memberOf(this.guild, target); const value = findRole(this.guild, role); hierarchy(this.guild, value); await member.roles.add(value, reason); return member; }
  public async remove(target: Target, role: Role | string, reason?: string): Promise<GuildMember> { const member = await memberOf(this.guild, target); const value = findRole(this.guild, role); await member.roles.remove(value, reason); return member; }
  public async create(name: string, color?: number | string, reason?: string): Promise<Role> { if (!name.trim()) throw new UserError("Role names cannot be empty."); const role = await this.guild.roles.create({ name, color: color as never, reason }); return role; }
}

class Members {
  public constructor(private readonly guild: Guild) {}
  public get(target: Target): Promise<GuildMember> { return memberOf(this.guild, target); }
  public async nickname(target: Target, name: string | null, reason?: string): Promise<GuildMember> { const member = await memberOf(this.guild, target); hierarchy(this.guild, member.roles.highest); await member.setNickname(name, reason); return member; }
  public async timeout(target: Target, duration: number, reason?: string): Promise<GuildMember> { const member = await memberOf(this.guild, target); if (duration < 1_000 || duration > 28 * 86_400_000) throw new UserError("Timeouts must be between 1 second and 28 days."); await member.timeout(duration, reason); return member; }
}

class Channels {
  public constructor(private readonly guild: Guild) {}
  public create(name: string, type: ChannelType = ChannelType.GuildText, reason?: string) { return this.guild.channels.create({ name, type: type as never, reason }); }
  public async delete(channel: { delete(reason?: string): Promise<unknown> }, reason?: string): Promise<void> { await channel.delete(reason); }
  public async lock(channel: GuildBasedChannel, reason?: string): Promise<void> { await this.#overwrite(channel, { SendMessages: false }, reason); }
  public async unlock(channel: GuildBasedChannel, reason?: string): Promise<void> { await this.#overwrite(channel, { SendMessages: null }, reason); }
  public async hide(channel: GuildBasedChannel, reason?: string): Promise<void> { await this.#overwrite(channel, { ViewChannel: false }, reason); }
  public async show(channel: GuildBasedChannel, reason?: string): Promise<void> { await this.#overwrite(channel, { ViewChannel: null }, reason); }
  public async slowmode(channel: GuildBasedChannel, seconds: number, reason?: string): Promise<void> {
    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 21_600) throw new UserError("Slowmode must be between 0 seconds and 6 hours.");
    if (!("setRateLimitPerUser" in channel) || typeof channel.setRateLimitPerUser !== "function") throw new UserError("This channel does not support slowmode.");
    await channel.setRateLimitPerUser(seconds, reason);
  }
  public async purge(channel: GuildBasedChannel, amount: number, userID?: string): Promise<number> {
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) throw new UserError("You can delete between 1 and 100 messages.");
    if (!("messages" in channel) || !("bulkDelete" in channel)) throw new UserError("Messages cannot be deleted in this channel.");
    const messages = await channel.messages.fetch({ limit: 100 });
    const selected = [...messages.values()].filter(message => !userID || message.author.id === userID).slice(0, amount);
    const deleted = await channel.bulkDelete(selected, true);
    return deleted.size;
  }

  async #overwrite(channel: GuildBasedChannel, permissions: object, reason?: string): Promise<void> {
    if (!("permissionOverwrites" in channel)) throw new UserError("Permissions cannot be changed for this channel.");
    await channel.permissionOverwrites.edit(this.guild.roles.everyone.id, permissions, { reason });
  }
}

class Threads {
  public constructor(private readonly guild: Guild) {}
  public async create(message: Message, name: string, reason?: string) { if (message.guildId !== this.guild.id) throw new UserError("That message is not in this server."); return message.startThread({ name, reason }); }
  public async archive(thread: { setArchived(value: boolean, reason?: string): Promise<unknown> }, reason?: string): Promise<void> { await thread.setArchived(true, reason); }
}

class Permissions {
  public constructor(private readonly guild: Guild) {}
  public bot(permission: keyof typeof PermissionFlagsBits): boolean { return Boolean(this.guild.members.me?.permissions.has(PermissionFlagsBits[permission])); }
  public member(target: Target, permission: keyof typeof PermissionFlagsBits): Promise<boolean> { return memberOf(this.guild, target).then(member => member.permissions.has(PermissionFlagsBits[permission])); }
}

class Settings {
  public constructor(private readonly guild: Guild) {}
  public async name(value: string, reason?: string): Promise<Guild> { if (!value.trim()) throw new UserError("Server names cannot be empty."); return this.guild.setName(value, reason); }
  public async icon(value: string | null, reason?: string): Promise<Guild> { return this.guild.setIcon(value, reason); }
}

async function memberOf(guild: Guild, target: Target): Promise<GuildMember> { const id = typeof target === "string" ? target : target.id; return guild.members.fetch(id).catch(() => { throw new UserError("That user is not in this server."); }); }
function findRole(guild: Guild, target: Role | string): Role { if (typeof target !== "string") return target; const role = guild.roles.cache.get(target) ?? guild.roles.cache.find(value => value.name.toLowerCase() === target.toLowerCase()); if (!role) throw new UserError(`Role "${target}" was not found.`); return role; }
function hierarchy(guild: Guild, role: Role): void { const me = guild.members.me; if (!me || role.position >= me.roles.highest.position) throw new UserError("That role is too high for the bot to manage."); }
