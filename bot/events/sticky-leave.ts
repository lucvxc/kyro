import { evt } from "../../index.ts";
import { rememberRoles } from "../services/roles.ts";

export default evt({ name: "guildMemberRemove", run: rememberRoles });
