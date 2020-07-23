import { Botkit } from "botkit";
import {
  SlackAdapter,
  SlackEventMiddleware,
  SlackMessageTypeMiddleware,
} from "@ajhall/botbuilder-adapter-slack";
import { decode } from "he";

require("dotenv").config();

if (!process.env.SLACK_CLIENT_SIGNING_SECRET || !process.env.SLACK_BOT_TOKEN) {
  throw (
    "Required environment variables for Slack are not defined. " +
    "Please check the documentation and ensure that all required variables are set."
  );
}

const adapter = new SlackAdapter({
  clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
  botToken: process.env.SLACK_BOT_TOKEN,
});

adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter: adapter,
});

const heardMessages = new Set();
controller.middleware.receive.use((_bot, message, next) => {
  if (process.env.DEBUG) {
    console.log(message);
  }

  if (message.ts) {
    if (heardMessages.has(message.ts)) {
      console.log(`Skipping duplicate message with timestamp '${message.ts}'`);
      return;
    }

    heardMessages.add(message.ts);
  }

  next();
});

controller.middleware.send.use((_bot, message, next) => {
  // Decode outgoing messages to make sure there are no weird URI encoded characters.
  // Encoding happens automatically sometimes for unknown reasons.
  message.text = decode(message.text);

  next();
});

controller.ready(() => {
  controller.loadModules(__dirname + "/features");
});
