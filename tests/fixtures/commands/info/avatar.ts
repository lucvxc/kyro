import { cmd } from "../../../../index.ts";

export default cmd({
  name: "avatar",
  description: "Show a user's avatar",
  example: "avatar @user",
  args: { user: { type: "user", description: "The user to show" } },
  run: () => undefined,
});
