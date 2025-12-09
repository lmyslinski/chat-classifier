import { Hono } from "hono";
import { z } from "zod";
import { getChatMetrics } from "./src/db/queries";
import { handleCorrection, processMessage } from "./src/handler";
import { sampleWorker, setupRepeatableJob } from "./src/queue";
import type { WebhookEvent } from "./src/types";

const app = new Hono();

setupRepeatableJob().catch(console.error);

console.log(`Started ${sampleWorker.name}`);

const correctionSchema = z.object({
  chatId: z.string(),
  correctCategory: z.enum(["billing", "technical", "sales", "general"]),
});

app
  .post("/", async (c) => {
    const body: WebhookEvent = await c.req.json();
    await processMessage(body);
    return c.text("");
  })
  .post("/correct", async (c) => {
    try {
      const body = await c.req.json();
      const { chatId, correctCategory } = correctionSchema.parse(body);

      return await handleCorrection(c, chatId, correctCategory);
    } catch (error) {
      console.error("Correction error:", error);
      return c.json({ error: "Invalid request" }, 400);
    }
  })
  .get("/metrics", async (c) => {
    try {
      const metrics = await getChatMetrics();
      return c.json(metrics);
    } catch (error) {
      console.error("Metrics error:", error);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  })
  .get("/health", (c) => {
    return c.text("ok");
  });

export default app;
