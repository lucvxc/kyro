import { cmp } from "../../../src/components/Cmp.ts";

export default cmp({
  id: /^customize:(config|save)$/,
  run: () => undefined,
});
