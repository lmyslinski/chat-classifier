import { type Job, Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { classifyChats} from "./classifier";

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
export async function setupRepeatableJob() {
  await sampleQueue.add("classify-job", null, {
    repeat: {
      every: 10000,
    },
  });
sampleWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Classification job ${job?.id} failed:`, err);
});

sampleWorker.on("error", (err: Error) => {
  console.error("Classification worker error:", err);
});
