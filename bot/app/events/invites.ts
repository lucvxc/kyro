import { evt } from "../../../index.ts";
import {
  cacheInvite,
  removeInvite,
  startInvites,
  trackJoin,
  trackLeave,
} from "../../features/invites/tracker.ts";

export default [
  evt({
    name: "clientReady",
    once: true,
    run: (client) => startInvites(client),
  }),
  evt({ name: "inviteCreate", run: (invite) => cacheInvite(invite) }),
  evt({ name: "inviteDelete", run: (invite) => removeInvite(invite) }),
  evt({ name: "guildMemberAdd", run: (member) => trackJoin(member) }),
  evt({ name: "guildMemberRemove", run: (member) => trackLeave(member) }),
];
