import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const chatModel = google("gemini-2.5-flash");
export const embeddingModel = google.textEmbedding("gemini-embedding-001");
