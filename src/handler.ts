import { type Embedding, embedMany } from "ai";
import type { Context } from "hono";
import {
  createCorrection,
  getCurrentChat,
  persistMessage,
  setCorrectedCategoryOnOriginalChat,
  updateChatEmbeddings,
} from "./db/queries";
import type { ChatCategory, ChatWithMessages, ThreadMessage, WebhookEvent } from "./types";

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

export async function handleCorrection(c: Context, chatId: string, correctCategory: ChatCategory) {
  const chat = await getCurrentChat(chatId);

  if (!chat) {
    return c.json({});
  }

  await setCorrectedCategoryOnOriginalChat(chatId, correctCategory);
  const embedding = await generateEmbeddingsForChat(chat);
  await createCorrection(chat.id, correctCategory);
  await updateChatEmbeddings(chat.id, embedding);

  return c.json({ success: true });
}

async function generateEmbeddingsForChat(chat: ChatWithMessages): Promise<Embedding> {
  const messageText = chat.messages.map((msg) => msg.text).join("\n");

  const { embeddings } = await embedMany({
    model: "gemini-embedding-001",
    values: [messageText],
  });
  if (embeddings.length < 1 || !embeddings[0]) {
    throw new Error("Invalid embedding ");
  }
  return embeddings[0];
}
