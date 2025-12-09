import { type Job, Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { classifyChats, generateEmbeddings } from "./classifier";

const connection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

export const sampleQueue = new Queue("chat-worker", { connection });

export const sampleWorker = new Worker(
  "chat-worker",
  async () => {
    console.log(`Starting classifier`);
    await classifyChats();
    console.log(`Classifier completed`);
  },
  { connection },
);

export const embeddingQueue = new Queue("embedding-worker", { connection });

export const embeddingWorker = new Worker(
  "embedding-worker",
  async () => {
    console.log(`Starting embedding generation`);
    await generateEmbeddings();
    console.log(`Embedding generation completed`);
  },
  { connection },
);

export async function setupRepeatableJob() {
  await sampleQueue.add("classify-job", null, {
    repeat: {
      every: 10000,
    },
  });

  await embeddingQueue.add("embedding-job", null, {
    repeat: {
      every: 60000,
    },
  });
}

sampleWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Classification job ${job?.id} failed:`, err);
});

sampleWorker.on("error", (err: Error) => {
  console.error("Classification worker error:", err);
});

embeddingWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Embedding job ${job?.id} failed:`, err);
});

embeddingWorker.on("error", (err: Error) => {
  console.error("Embedding worker error:", err);
});
