import { persistMessage } from "./db/queries";
import type { ThreadMessage, WebhookEvent } from "./types";

function extractMessage(event: WebhookEvent): ThreadMessage {
  return {
    msgId: event.payload.event.id,
    type: event.payload.event.custom_id.includes("chatbot") ? "bot" : "user",
    text: event.payload.event.text,
    chatId: event.payload.thread_id,
    threadId: event.payload.thread_id,
    timestamp: event.payload.event.created_at,
  };
}
export async function processMessage(event: WebhookEvent) {
  if (event.secret_key !== process.env.WH_SECRET) {
    console.warn("invalid signing key");
    return;
  }

  const msg = extractMessage(event);
  console.log(msg);
  await persistMessage(msg);
}
