import type { WebhookEvent } from "./types";

export async function saveMessage(event: WebhookEvent) {
  if (event.secret_key !== process.env.WH_SECRET) {
    console.warn("invalid signing key");
    return;
  }

  if (!event.payload.event.author_id.includes("chatbot")) {
    console.log(event.payload.event.text);
    // persist msg
  }
}
