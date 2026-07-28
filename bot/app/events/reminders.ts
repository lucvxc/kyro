import { evt } from "../../../index.ts";
import { startReminders } from "../../features/reminders/index.ts";

export default evt({
  name: "clientReady",
  once: true,
  run: (client) => startReminders(client),
});
