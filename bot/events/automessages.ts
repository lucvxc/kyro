import { evt } from "../../index.ts";
import { restoreAutomessages } from "../services/settings/automessages.ts";
export default evt({
  name: "clientReady",
  once: true,
  run: restoreAutomessages,
});
