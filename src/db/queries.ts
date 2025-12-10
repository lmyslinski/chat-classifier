import { type Embedding, embedMany } from "ai";
import { and, cosineDistance, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { embeddingModel } from "../ai";
import type { ChatCategory, ChatMetrics, ChatWithMessages, ThreadMessage } from "../types";
import { db } from "./db";
import { chats, corrections, messages } from "./schema";

export async function getCurrentChat(chatId: string): Promise<ChatWithMessages | undefined> {
  return (await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
    with: {
      messages: {
        where: and(eq(messages.chatId, chatId), eq(messages.type, "user")),
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
    model: embeddingModel,
    values: [messageText],
  });
  const embedding = embeddings[0];

  if (!embedding) {
    return null;
  }

  // Search for similar corrections using cosine similarity
  const similarity = sql<number>`1 - (${cosineDistance(corrections.embedding, embedding)})`;

  const result = await db
    .select({
      correctedCategory: corrections.correctedCategory,
      similarity,
    })
    .from(corrections)
    .where(gt(similarity, 0.85))
    .orderBy((t) => desc(t.similarity))
    .limit(1);

  return result.length > 0
    ? { correctedCategory: result[0]!.correctedCategory, similarity: result[0]!.similarity }
    : null;
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

export async function getChatMetrics(): Promise<ChatMetrics> {
  const totalChatsResult = await db.select({ count: sql`count(*)` }).from(chats);
  const totalChats = Number(totalChatsResult[0]?.count || 0);

  const correctedChatsResult = await db
    .select({ count: sql`count(*)` })
    .from(chats)
    .where(eq(chats.isManuallyCorrected, true));
  const correctedChats = Number(correctedChatsResult[0]?.count || 0);

  const correctionRate = totalChats > 0 ? (correctedChats / totalChats) * 100 : 0;
  return {
    totalChats,
    correctedChats,
    correctionRate: Math.round(correctionRate * 100) / 100, // Round to 2 decimal places
  };
}
