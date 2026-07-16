import { PermissionFlagsBits, type Client, type Guild, type GuildMember, type Role, type User, type VoiceBasedChannel } from "discord.js";
import { UserError } from "./Errors.ts";

export interface ModOptions { reason?: string; deleteDays?: number; }

export class Moderation {
  public constructor(
    private readonly client: Client,
    private readonly guild: Guild | null,
    private readonly actor: User,
  ) {}

  public async ban(user: User, options: ModOptions = {}): Promise<void> {
    const guild = this.#guild();
    const member = await this.#member(guild, user);
    await this.#check(member, "ban", PermissionFlagsBits.BanMembers);
    const days = options.deleteDays ?? 0;
    if (!Number.isInteger(days) || days < 0 || days > 7) throw new UserError("Message deletion must be between 0 and 7 days.");
    await guild.members.ban(user, { reason: this.#reason(options), deleteMessageSeconds: days * 86_400 });
  }

  public async softban(user: User, options: ModOptions = {}): Promise<void> {
    await this.ban(user, options);
    await this.guild!.bans.remove(user, this.#reason(options));
  }

  public async kick(user: User, options: ModOptions = {}): Promise<void> {
    const guild = this.#guild();
    const member = await this.#member(guild, user);
    await this.#check(member, "kick", PermissionFlagsBits.KickMembers);
    await member.kick(this.#reason(options));
  }

  public async timeout(user: User, duration: number, options: ModOptions = {}): Promise<void> {
    const guild = this.#guild();
    if (!Number.isInteger(duration) || duration < 1_000 || duration > 28 * 86_400_000) throw new UserError("Timeouts must be between 1 second and 28 days.");
    const member = await this.#member(guild, user);
    await this.#check(member, "timeout", PermissionFlagsBits.ModerateMembers);
    await member.timeout(duration, this.#reason(options));
  }

  public async untimeout(user: User, options: ModOptions = {}): Promise<void> {
    const member = await this.#member(this.#guild(), user);
    await this.#check(member, "remove the timeout from", PermissionFlagsBits.ModerateMembers);
    if (!member.isCommunicationDisabled()) throw new UserError("That member is not timed out.");
    await member.timeout(null, this.#reason(options));
  }

  public async unban(user: User, options: ModOptions = {}): Promise<void> {
    const guild = this.#guild();
    if (!await guild.bans.fetch(user.id).catch(() => null)) throw new UserError("That user is not banned.");
    await guild.bans.remove(user, this.#reason(options));
  }

  public async nickname(user: User, name: string | null, options: ModOptions = {}): Promise<void> {
    const member = await this.#member(this.#guild(), user);
    await this.#check(member, "change the nickname of", PermissionFlagsBits.ManageNicknames);
    await member.setNickname(name, this.#reason(options));
  }

  public async role(user: User, role: Role, add: boolean, options: ModOptions = {}): Promise<void> {
    const member = await this.#member(this.#guild(), user);
    await this.#role(member, role, add, options);
  }

  public async toggleRole(user: User, role: Role, options: ModOptions = {}): Promise<boolean> {
    const member = await this.#member(this.#guild(), user);
    const add = !member.roles.cache.has(role.id);
    await this.#role(member, role, add, options);
    return add;
  }

  async #role(member: GuildMember, role: Role, add: boolean, options: ModOptions): Promise<void> {
    await this.#check(member, `${add ? "give a role to" : "remove a role from"}`, PermissionFlagsBits.ManageRoles);
    const me = member.guild.members.me!;
    if (role.managed) throw new UserError("That role is managed by an integration.");
    if (role.position >= me.roles.highest.position) throw new UserError("That role is too high for me to manage.");
    if (add && member.roles.cache.has(role.id)) throw new UserError("That member already has that role.");
    if (!add && !member.roles.cache.has(role.id)) throw new UserError("That member does not have that role.");
    await member.roles[add ? "add" : "remove"](role, this.#reason(options));
  }

  public async disconnect(user: User, options: ModOptions = {}): Promise<void> {
    const member = await this.#voice(user, "disconnect", PermissionFlagsBits.MoveMembers);
    await member.voice.disconnect(this.#reason(options));
  }

  public async move(user: User, channel: VoiceBasedChannel, options: ModOptions = {}): Promise<void> {
    const member = await this.#voice(user, "move", PermissionFlagsBits.MoveMembers);
    await member.voice.setChannel(channel, this.#reason(options));
  }

  public async deafen(user: User, value: boolean, options: ModOptions = {}): Promise<void> {
    const member = await this.#voice(user, value ? "deafen" : "undeafen", PermissionFlagsBits.DeafenMembers);
    await member.voice.setDeaf(value, this.#reason(options));
  }

  #guild(): Guild { if (!this.guild) throw new UserError("This moderation command can only be used in a server."); return this.guild; }
  async #member(guild: Guild, user: User): Promise<GuildMember> { return guild.members.fetch(user.id).catch(() => { throw new UserError("That user is not a member of this server."); }); }
  async #voice(user: User, action: string, permission: bigint): Promise<GuildMember> {
    const member = await this.#member(this.#guild(), user);
    await this.#check(member, action, permission);
    if (!member.voice.channelId) throw new UserError("That member is not in a voice channel.");
    return member;
  }
  async #check(member: GuildMember, action: string, permission: bigint): Promise<void> {
    const me = member.guild.members.me;
    if (!me) throw new UserError("I cannot verify my role in this server.");
    if (!me.permissions.has(permission)) throw new UserError(`I do not have permission to ${action} members.`);
    if (member.id === this.actor.id) throw new UserError(`You cannot ${action} yourself.`);
    if (member.id === member.guild.ownerId) throw new UserError(`You cannot ${action} the server owner.`);
    if (member.id === me.id || member.roles.highest.position >= me.roles.highest.position) throw new UserError(`I cannot ${action} that member because of role hierarchy.`);
    const actor = await member.guild.members.fetch(this.actor.id);
    if (actor.id !== member.guild.ownerId && member.roles.highest.position >= actor.roles.highest.position) {
      throw new UserError(`You cannot ${action} that member because of role hierarchy.`);
    }
  }
  #reason(options: ModOptions): string { return (options.reason?.trim() || `Moderation action by ${this.actor.tag}`).slice(0, 512); }
}
