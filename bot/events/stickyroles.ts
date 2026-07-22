import { evt } from "../../index.ts";
import { rememberRoles, restoreRoles } from "../services/roles/sticky.ts";

export default [
  evt({ name: "guildMemberRemove", run: rememberRoles }),
  evt({ name: "guildMemberAdd", run: restoreRoles }),
];
