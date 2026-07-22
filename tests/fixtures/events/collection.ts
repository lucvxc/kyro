import { Events } from "discord.js";
import { evt } from "../../../index.ts";

export default [
  evt({ name: Events.GuildCreate, run: () => undefined }),
  evt({ name: Events.GuildDelete, run: () => undefined }),
];
