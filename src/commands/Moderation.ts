import { PermissionFlagsBits, type Client, type Guild, type GuildMember, type User } from "discord.js";
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
    this.#check(member, "ban");
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
    this.#check(member, "kick");
    await member.kick(this.#reason(options));
  }

  public async timeout(user: User, duration: number, options: ModOptions = {}): Promise<void> {
    const guild = this.#guild();
    if (!Number.isInteger(duration) || duration < 1_000 || duration > 28 * 86_400_000) throw new UserError("Timeouts must be between 1 second and 28 days.");
    const member = await this.#member(guild, user);
    this.#check(member, "timeout");
    await member.timeout(duration, this.#reason(options));
  }

  public async unban(user: User, options: ModOptions = {}): Promise<void> {
    const guild = this.#guild();
    if (!await guild.bans.fetch(user.id).catch(() => null)) throw new UserError("That user is not banned.");
    await guild.bans.remove(user, this.#reason(options));
  }

  #guild(): Guild { if (!this.guild) throw new UserError("This moderation command can only be used in a server."); return this.guild; }
  async #member(guild: Guild, user: User): Promise<GuildMember> { return guild.members.fetch(user.id).catch(() => { throw new UserError("That user is not a member of this server."); }); }
  #check(member: GuildMember, action: string): void {
    const me = member.guild.members.me;
    if (!me) throw new UserError("I cannot verify my role in this server.");
    const permission = action === "ban" ? PermissionFlagsBits.BanMembers : action === "kick" ? PermissionFlagsBits.KickMembers : PermissionFlagsBits.ModerateMembers;
    if (!me.permissions.has(permission)) throw new UserError(`I do not have permission to ${action} members.`);
    if (member.id === this.actor.id) throw new UserError(`You cannot ${action} yourself.`);
    if (member.id === me.id || member.roles.highest.position >= me.roles.highest.position) throw new UserError(`I cannot ${action} that member because of role hierarchy.`);
  }
  #reason(options: ModOptions): string { return (options.reason?.trim() || `Moderation action by ${this.actor.tag}`).slice(0, 512); }
}
