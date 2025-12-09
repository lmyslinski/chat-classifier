import { eq, isNull, lt, or } from "drizzle-orm";
import type { ChatWithMessages } from "../types";
import { db } from "./db";
import { chats, messages } from "./schema";

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
