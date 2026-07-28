import { evt } from "../../../index.ts";
import { restoreAutomessages } from "../../features/settings/automessages.ts";
export default evt({
  name: "clientReady",
  once: true,
  run: restoreAutomessages,
});
