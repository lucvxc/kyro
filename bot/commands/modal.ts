import { cmd, modal, input } from "../../index.ts";

export default cmd({
  name: "modal-test",
  description: "Open a Kyro modal",
  type: "slash",
  run: (ctx) => ctx.showModal(modal({
    id: "modal-test",
    title: "Kyro Modal",
    inputs: [
      { id: "name", label: "Your name", placeholder: "Type your name" },
      { id: "message", label: "Message", style: "paragraph", required: false },
    ],
  })),
});
