import { evt } from "../../index.ts";
import { restoreRoles } from "../services/roles.ts";

export default evt({ name: "guildMemberAdd", run: restoreRoles });
