import type { WebhookEvent } from "./types";

function extractMessage(event: WebhookEvent) {
  return {
    msgId: event.payload.event.id,
    type: event.payload.event.custom_id.includes("chatbot") ? "bot" : "user",
    text: event.payload.event.text,
    chatId: event.payload.thread_id,
    threadId: event.payload.thread_id,
    timestamp: event.payload.event.created_at,
  };
}

export async function saveMessage(event: WebhookEvent) {
  if (event.secret_key !== process.env.WH_SECRET) {
    console.warn("invalid signing key");
    return;
  }

  const msg = extractMessage(event);
  console.log(msg);
}
