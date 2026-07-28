import { evt } from "../../../index.ts";
import { startGiveaways } from "../../features/giveaways/index.ts";

export default evt({
  name: "clientReady",
  once: true,
  run: (client) => startGiveaways(client),
});
