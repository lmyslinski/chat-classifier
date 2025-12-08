import { Hono } from "hono";

const app = new Hono();

app
  .post("/webhook", (c) => {
    return c.text("Hello Hono!");
  })
  .get("/health", (c) => {
    return c.text("ok");
  });

export default app;

