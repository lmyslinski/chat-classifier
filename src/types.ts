export type ChatCategory = "billing" | "technical" | "sales" | "general";

export interface ChatWithMessages {
  id: string;
  category: ChatCategory | null;
  confidence: number | null;
  isManuallyCorrected?: boolean;
  correctedAt?: Date;
  messages: Array<{
    id: string;
    type: string;
    text: string;
    chatId: string;
    timestamp: Date;
  }>;
}

export interface Correction {
  id: number;
  chatId: string;
  correctedCategory: ChatCategory;
  embedding: number[];
  createdAt: Date;
}

export interface SimilarCorrection {
  correctedCategory: ChatCategory;
  similarity: number;
}

export type ThreadMessage = {
  msgId: string;
  type: "user" | "bot";
  text: string;
  chatId: string;
  threadId: string;
  timestamp: string;
};

// Webhook payload types
export interface WebhookEvent {
  webhook_id: string;
  secret_key: string;
  action: string;
  organization_id: string;
  payload: Payload;
  additional_data: AdditionalData;
}

export interface Payload {
  chat_id: string;
  thread_id: string;
  event: Event;
}

export interface Event {
  id: string;
  custom_id: string;
  visibility: string;
  created_at: string;
  author_id: string;
  properties: Properties;
  type: string;
  text: string;
}

export interface Properties {
  source: Source;
}

export interface Source {
  client_id: string;
}

export interface AdditionalData {
  chat_presence_user_ids: string[];
  chat_properties: ChatProperties;
}

export interface ChatProperties {
  routing: Routing;
  source: Source2;
}

export interface Routing {
  continuous: boolean;
  email_follow_up: boolean;
  pinned: boolean;
}

export interface Source2 {
  client_id: string;
  customer_client_id: string;
}
