import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, varchar, vector } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  category: varchar("category", {
    length: 255,
    enum: ["billing", "technical", "sales", "general"],
  }),
  confidence: integer("confidence"),
  embedding: vector({ dimensions: 768 }),
  isManuallyCorrected: boolean("is_manually_corrected").default(false),
  correctedAt: timestamp("corrected_at"),
});

export const corrections = pgTable("corrections", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  chatId: varchar("chat_id", { length: 255 })
    .notNull()
    .references(() => chats.id),
  correctedCategory: varchar("corrected_category", {
    length: 255,
    enum: ["billing", "technical", "sales", "general"],
  }).notNull(),
  embedding: vector({ dimensions: 768 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 10, enum: ["bot", "user"] }).notNull(),
  text: text("text").notNull(),
  chatId: varchar("chat_id", { length: 255 })
    .notNull()
    .references(() => chats.id),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
});

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  corrections: many(corrections),
}));

export const correctionsRelations = relations(corrections, ({ one }) => ({
  chat: one(chats, {
    fields: [corrections.chatId],
    references: [chats.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
