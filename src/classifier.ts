import { GoogleGenAI } from "@google/genai";
import { db } from "./db/db";

const ai = new GoogleGenAI({});

export async function classifyChats() {
  // we could use batch api here but this is simpler
  const unclassifiedChats = await db.query.chats.findMany({
    where: { category: null },
  });
}

export async function generateEmbeddings() {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: ["What is the meaning of life?", "What is the purpose of existence?", "How do I bake a cake?"],
  });
}
