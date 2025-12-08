import { type Job, Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

export const sampleQueue = new Queue("chat-worker", { connection });

export const sampleWorker = new Worker(
  "chat-worker",
  async (job: Job) => {
    console.log(`Processing job ${job.id} at ${new Date().toISOString()}`);
    console.log("Job data:", job.data);

    console.log(`Job ${job.id} completed`);
    return { processedAt: new Date() };
  },
  { connection },
);

export async function setupRepeatableJob() {
  await sampleQueue.add(
    "",
    { message: "This job runs every 10 seconds" },
    {
      repeat: {
        every: 10000,
      },
    },
  );
}

sampleWorker.on("completed", (job: Job, result: any) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

sampleWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err);
});

sampleWorker.on("error", (err: Error) => {
  console.error("Worker error:", err);
});
