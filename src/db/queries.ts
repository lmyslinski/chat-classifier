import { eq, isNull, lt, or } from "drizzle-orm";
import type { ChatWithMessages, ThreadMessage } from "../types";
import { db } from "./db";
import { chats, messages } from "./schema";

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
