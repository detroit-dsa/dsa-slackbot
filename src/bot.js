import { Botkit } from "botkit";
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware } from "botbuilder-adapter-slack";
import { decode } from "he";

require("dotenv").config();

function getAdapter() {
  const adapter = new SlackAdapter({
    clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
    botToken: process.env.SLACK_BOT_TOKEN
  });

  adapter.use(new SlackEventMiddleware());
  adapter.use(new SlackMessageTypeMiddleware());

  return adapter;
}

const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter: getAdapter()
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
