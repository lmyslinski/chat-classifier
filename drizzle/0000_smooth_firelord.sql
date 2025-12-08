CREATE TABLE "messages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(10) NOT NULL,
	"text" text NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;