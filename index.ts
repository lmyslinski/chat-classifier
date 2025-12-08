import { Hono } from "hono";
import { processMessage } from "./src/handler";
import { sampleWorker, setupRepeatableJob } from "./src/queue";
import type { WebhookEvent } from "./src/types";

const app = new Hono();

setupRepeatableJob().catch(console.error);

console.log(`Started ${sampleWorker.name}`);

app
  .post("/", async (c) => {
    const body: WebhookEvent = await c.req.json();
    await processMessage(body);
    return c.text("");
  })
  .get("/health", (c) => {
    return c.text("ok");
  });

export default app;
