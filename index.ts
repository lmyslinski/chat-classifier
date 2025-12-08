import { Hono } from "hono";

const app = new Hono();

app
  .post("/", (c) => {
    const body = c.req.json();
    console.log(body);
    return c.text("");
  })
  .get("/health", (c) => {
    return c.text("ok");
  });

export default app;

