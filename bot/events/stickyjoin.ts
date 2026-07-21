import { evt } from "../../index.ts";
import { restoreRoles } from "../services/roles/sticky.ts";

export default evt({ name: "guildMemberAdd", run: restoreRoles });
