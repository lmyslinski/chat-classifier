import { google } from "@ai-sdk/google";
import { embedMany, generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db/db";
import {
  createCorrection,
  fetchCorrectedChatsWithoutEmbeddings,
  fetchUnclassifedOrLowConfidenceChats,
  findSimilarCorrection,
} from "./db/queries";
import { chats } from "./db/schema";
import type { ChatWithMessages, ChatCategory } from "./types";

export async function classifyChats() {
  const unclassifiedChats = await fetchUnclassifedOrLowConfidenceChats();
  console.log(`Found ${unclassifiedChats.length} chats`);
  await Promise.all(unclassifiedChats.map(classifyChat));
}

const classificationSchema = z.object({
  category: z.enum(["billing", "technical", "sales", "general"]).describe("The category of the chat"),
  confidence: z.number().min(0).max(100).describe("Confidence score from 0-100"),
});

async function classifyChat(chat: ChatWithMessages) {
  const messageText = chat.messages.map((msg) => msg.text).join("\n");

  console.log(`Starting classification: ${messageText}`);

  const similarCorrection = await findSimilarCorrection(chat.messages);
  if (similarCorrection) {
    console.log(
      `Found similar correction: ${similarCorrection.correctedCategory} (similarity: ${similarCorrection.similarity})`,
    );

    await db
      .update(chats)
      .set({
        category: similarCorrection.correctedCategory as "billing" | "technical" | "sales" | "general",
        confidence: 85,
      })
      .where(eq(chats.id, chat.id));

    return;
  }

  // 2. Fallback to AI classification
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: classificationSchema,
    prompt: `Classify this chat conversation into one of these categories: billing, technical, sales, general. Also return the confidence score from 0-100 on how well does the category fit.

Chat messages:
${messageText}

Categories:
- billing: Questions about payments, invoices, pricing, subscriptions
- technical: Technical issues, bugs, feature requests, how-to questions
- sales: Sales inquiries, product demos, pricing questions, new customer questions
- general: General conversation, greetings, feedback, other topics`,
  });

  console.log(`AI Category: ${object.category} Confidence: ${object.confidence}`);

  await db
    .update(chats)
    .set({
      category: object.category,
      confidence: object.confidence,
    })
    .where(eq(chats.id, chat.id));
}

export async function generateEmbeddings() {
  const correctedChats = await fetchCorrectedChatsWithoutEmbeddings();
  console.log(`Generating embeddings for ${correctedChats.length} corrected chats`);

  for (const chat of correctedChats) {
    const messageText = chat.messages.map((msg) => msg.text).join("\n");

    const { embeddings } = await embedMany({
      model: "gemini-embedding-001",
      values: [messageText],
    });

    const embedding = embeddings[0] || [];
    await createCorrection(chat.id, chat.category as ChatCategory, embedding);
  }
}
