import { type Embedding, embedMany } from "ai";
import { eq, isNull, lt, or, sql } from "drizzle-orm";
import type { ChatCategory, ChatWithMessages, ThreadMessage } from "../types";
import { db } from "./db";
import { chats, corrections, messages } from "./schema";

export async function getCurrentChat(chatId: string): Promise<ChatWithMessages | undefined> {
  return (await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
    with: {
      messages: {
        where: eq(chats.id, chatId),
      },
    },
  })) as ChatWithMessages | undefined;
}

export async function fetchUnclassifedOrLowConfidenceChats(): Promise<ChatWithMessages[]> {
  const unclassifiedChats = (await db.query.chats.findMany({
    where: or(isNull(chats.category), lt(chats.confidence, 50)),
    with: {
      messages: {
        where: eq(messages.type, "user"),
        orderBy: messages.timestamp,
      },
    },
  })) as ChatWithMessages[];

  return unclassifiedChats.filter((p) => p.messages.length > 0);
}

export async function persistMessage(msg: ThreadMessage) {
  const existingChat = await db.select().from(chats).where(eq(chats.id, msg.chatId)).limit(1);

  if (existingChat.length === 0) {
    await db.insert(chats).values({
      id: msg.chatId,
    });
  }

  await db.insert(messages).values({
    id: msg.msgId,
    text: msg.text,
    chatId: msg.chatId,
    timestamp: new Date(msg.timestamp),
    type: msg.type,
  });
}

export async function findSimilarCorrection(
  messages: any[],
): Promise<{ correctedCategory: string; similarity: number } | null> {
  const messageText = messages.map((m) => m.text).join("\n");

  const { embeddings } = await embedMany({
    model: "gemini-embedding-001",
    values: [messageText],
  });
  const embedding = embeddings[0];

  // Search for similar corrections using cosine similarity
  const result = await db.execute(sql`
    SELECT 
      corrected_category,
      1 - (embedding <=> ${embedding}) as similarity
    FROM corrections 
    WHERE 1 - (embedding <=> ${embedding}) > 0.85
    ORDER BY similarity DESC
    LIMIT 1
  `);

  return result.rows.length > 0 ? (result.rows[0] as { correctedCategory: string; similarity: number }) : null;
}

export async function createCorrection(chatId: string, correctedCategory: ChatCategory, embedding: Embedding) {
  await db.insert(corrections).values({
    chatId,
    correctedCategory,
    embedding,
  });
}

export async function setCorrectedCategoryOnOriginalChat(chatId: string, correctedCategory: ChatCategory) {
  await db
    .update(chats)
    .set({
      category: correctedCategory,
      isManuallyCorrected: true,
      correctedAt: new Date(),
    })
    .where(eq(chats.id, chatId));
}

export async function fetchCorrectedChatsWithoutEmbeddings(): Promise<ChatWithMessages[]> {
  const correctedChats = (await db.query.chats.findMany({
    where: eq(chats.isManuallyCorrected, true),
    with: {
      messages: {
        where: eq(messages.type, "user"),
        orderBy: messages.timestamp,
      },
    },
  })) as ChatWithMessages[];

  return correctedChats.filter((p) => p.messages.length > 0);
}
