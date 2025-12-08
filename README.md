# chat-classifier

## Getting started

Start the dependencies:

`docker-compose up -d`

Run the migrations: 

`bunx drizzle-kit migrate`

`cp .env.sample .env`

Create the webhook handler in the Livechat developer dashboard, get the webhook secret and put it into `WH_SECRET`

# Issue log

- Couldn't sign up with a priv account via SSO (email worked)
- Can't access developer console
- Invalid branch: https://github.com/livechat/lc-sdk-js/tree/v3.7/docs from https://platform.text.com/docs/messaging/js-sdk
- The SDK fragmentation & docs are inconsistent. Why do I need to create an Agent app with widgets and payments in order to receive webhooks?
- Couldn't click skip on the popup to mark app as paid
- Why do I need to be on the marketplace for a backend integration?
- SDK would be nice for event handling but seems a bit fresh


