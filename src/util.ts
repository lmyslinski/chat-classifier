import { embedMany } from "ai";

async function generateEmbeddingsForChat(chat: ChatWithMessages) {
  const messageText = chat.messages.map((msg) => msg.text).join("\n");

  const { embeddings } = await embedMany({
    model: "gemini-embedding-001",
    values: [messageText],
  });
  return embeddings[0];
}
