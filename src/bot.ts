import { Botkit } from "botkit";
import { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware } from "botbuilder-adapter-slack";
import { WebAdapter } from "botbuilder-adapter-web";

require("dotenv").config();

function getAdapter() {
  if (process.env.ADAPTER_TYPE?.toLowerCase() == "slack") {
    const adapter = new SlackAdapter({
      clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
      botToken: process.env.SLACK_BOT_TOKEN
    });

    adapter.use(new SlackEventMiddleware());
    adapter.use(new SlackMessageTypeMiddleware());

    return adapter;
  }

  return new WebAdapter({});
}

const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter: getAdapter()
});

controller.ready(() => {
  controller.loadModules(__dirname + "/features");
});
