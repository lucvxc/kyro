import { evt } from "../../index.ts";
import { restoreTempRoles } from "../services/roles/temporary.ts";

export default evt({ name: "clientReady", once: true, run: restoreTempRoles });
