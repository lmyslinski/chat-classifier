import { Hono } from "hono";
import { saveMessage } from "./src/handler";
import type { WebhookEvent } from "./src/types";

const app = new Hono();

app
  .post("/", async (c) => {
    const body: WebhookEvent = await c.req.json();
    await saveMessage(body);
    return c.text("");
  })
  .get("/health", (c) => {
    return c.text("ok");
  });

export default app;
