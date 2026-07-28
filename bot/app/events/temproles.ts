import { evt } from "../../../index.ts";
import { restoreTempRoles } from "../../features/roles/temporary.ts";

export default evt({ name: "clientReady", once: true, run: restoreTempRoles });
