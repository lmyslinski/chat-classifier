import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { embedMany } from "ai";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db/db";
import { chats, messages } from "./db/schema";
import type { ChatWithMessages } from "./types";

const google = createGoogleGenerativeAI({});

const classificationSchema = z.object({
  category: z.enum(["billing", "technical", "sales", "general"]).describe("The category of the chat"),
  confidence: z.number().min(0).max(100).describe("Confidence score from 0-100"),
});

async function fetchUnclassifedOrLowConfidenceChats(): Promise<ChatWithMessages[]> {
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

async function classifyChat(chat: ChatWithMessages) {
  const messageText = chat.messages.map((msg) => msg.text).join("\n");
  const result = await generateObject({
    model: "google/gemini-2.5-flash",
    system: `Classify this chat conversation into one of these categories: billing, technical, sales, general.

Chat messages:
${messageText}

Categories:
- billing: Questions about payments, invoices, pricing, subscriptions
- technical: Technical issues, bugs, feature requests, how-to questions
- sales: Sales inquiries, product demos, pricing questions, new customer questions
- general: General conversation, greetings, feedback, other topics`,
    prompt,
    schema: z.object({
      notifications: z.array(
        z.object({
          name: z.string().describe("Name of a fictional person."),
          message: z.string().describe("Do not use emojis or links."),
          minutesAgo: z.number(),
        }),
      ),
    }),
  });
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(classificationSchema),
    },
  });

  const result = classificationSchema.parse(JSON.parse(response.text!));

  await db
    .update(chats)
    .set({
      category: result.category,
      confidence: result.confidence,
    })
    .where(eq(chats.id, chat.id));
}

export async function classifyChats() {
  const unclassifiedChats = await fetchUnclassifedOrLowConfidenceChats();
  await Promise.all(unclassifiedChats.map(classifyChat));
}

export async function generateEmbeddings() {
  const { embeddings } = await embedMany({
    model: "gemini-embedding-001",
    values: ["sunny day at the beach", "rainy afternoon in the city", "snowy night in the mountains"],
  });
}
