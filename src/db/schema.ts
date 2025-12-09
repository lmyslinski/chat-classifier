import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const chats = pgTable("chats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  category: varchar("type", {
    length: 255,
    enum: ["billing", "technical", "sales", "general"],
  }),
  confidence: integer("confidence"),
});

export const messages = pgTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 10, enum: ["bot", "user"] }).notNull(),
  text: text("text").notNull(),
  chatId: varchar("chatId", { length: 255 })
    .notNull()
    .references(() => chats.id),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
});

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
