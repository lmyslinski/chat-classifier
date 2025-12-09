# chat-classifier

## Getting started

Start the dependencies:

`docker-compose up -d`

Run the migrations: 

`bunx drizzle-kit migrate`

Create and populate the .env file:

`cp .env.sample .env`

Run the server:

`bun dev`

# Solution overview

- All incoming chats are persisted to the DB
- Every 10 seconds we run a job that classifies non-classified chats:
  - Use the embeddings between current chat and corrected chat embeddings to find most relevant conversation
  - Use that category if % is good enough
  - Else use AI to classify chat
- When a correction is sent, we calculate and store the embeddings for the chat along with embeddings
- Bot messages are skipped, only user messages are taken into account


# Remaining issues

- No built-in stop for low % chats
- general category is problematic
- lack of polish: logging, transactions, indexes etc.
- might as well not use queues at all
- no tests

# Design log

- My initial thought was to classify each chat with a confidence rate - if it's too low initially, we re-classify as we get more messages coming in. This won't work since we have `general`, so it will always fit as a fallback.
- that 10k chats per hour seems like much but I don't really think this needs a queue. Most chats will be classified after one/two messages tops
- we might use batch processing to handle load better but this will increase the latency 
- since latency is not that big of a deal, we will just run a periodic job
- go-to design for now: classify batch of chats every 10 secs, check the embeddings against the corrections

# Issue log

- Couldn't sign up with a priv account via SSO (email worked)
- Can't access developer console
- Invalid branch: https://github.com/livechat/lc-sdk-js/tree/v3.7/docs from https://platform.text.com/docs/messaging/js-sdk
- The SDK fragmentation & docs are inconsistent. Why do I need to create an Agent app with widgets and payments in order to receive webhooks?
- Couldn't click skip on the popup to mark app as paid
- Why do I need to be on the marketplace for a backend integration?
- SDK would be nice for event handling but seems a bit fresh


