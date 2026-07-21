import { evt } from "../../index.ts";
import { rememberRoles } from "../services/roles/sticky.ts";

export default evt({ name: "guildMemberRemove", run: rememberRoles });
