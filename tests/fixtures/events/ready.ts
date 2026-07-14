import { Events } from "discord.js";
import { evt } from "../../../index.ts";

export default evt({
  name: Events.ClientReady,
  run: () => undefined,
});
