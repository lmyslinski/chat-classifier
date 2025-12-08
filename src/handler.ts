import { db } from "./db/db";
import { messages } from "./db/schema";
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

async function persistMessage(msg: ThreadMessage) {
  await db.insert(messages).values({
    id: msg.msgId,
    text: msg.text,
    chatId: msg.chatId,
    timestamp: msg.timestamp,
    type: msg.type,
  });
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
