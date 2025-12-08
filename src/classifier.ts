import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { db } from "./db/db";
import { chats, messages } from "./db/schema";
import { eq, and, or, lt, isNull } from "drizzle-orm";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const classificationSchema = z.object({
  category: z.enum(["billing", "technical", "sales", "general"]).describe("The category of the chat"),
  confidence: z.number().min(0).max(100).describe("Confidence score from 0-100")
});

interface ChatWithMessages {
  id: string;
  category: string | null;
  confidence: number | null;
  messages: Array<{
    id: string;
    type: string;
    text: string;
    chatId: string;
    timestamp: Date;
  }>;
}

export async function classifyChats() {
  // Fetch chats where category is null OR confidence < 50%
  const unclassifiedChats = await db.query.chats.findMany({
    where: or(
      isNull(chats.category),
      lt(chats.confidence, 50)
    ),
    with: {
      messages: {
        where: eq(messages.type, 'user'),
        orderBy: messages.timestamp
      }
    }
  }) as ChatWithMessages[];

  for (const chat of unclassifiedChats) {
    if (!chat.messages || chat.messages.length === 0) {
      continue;
    }

    // Format user messages for classification
    const messageText = chat.messages
      .map((msg) => msg.text)
      .join('\n');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Classify this chat conversation into one of these categories: billing, technical, sales, general.

Chat messages:
${messageText}

Categories:
- billing: Questions about payments, invoices, pricing, subscriptions
- technical: Technical issues, bugs, feature requests, how-to questions
- sales: Sales inquiries, product demos, pricing questions, new customer questions
- general: General conversation, greetings, feedback, other topics`,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(classificationSchema),
        },
      });

      const result = classificationSchema.parse(JSON.parse(response.text!));
      
      await db.update(chats)
        .set({
          category: result.category,
          confidence: result.confidence
        })
        .where(eq(chats.id, chat.id));
        
    } catch (error) {
      console.error(`Error classifying chat ${chat.id}:`, error);
    }
  }
}

export async function generateEmbeddings() {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: ["What is the meaning of life?", "What is the purpose of existence?", "How do I bake a cake?"],
  });
}
