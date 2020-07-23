import {
  SlackAdapter,
  SlackEventMiddleware,
  SlackMessageTypeMiddleware,
} from "@ajhall/botbuilder-adapter-slack";

if (!process.env.SLACK_CLIENT_SIGNING_SECRET || !process.env.SLACK_BOT_TOKEN) {
  throw (
    "Required environment variables for Slack are not defined. " +
    "Please check the documentation and ensure that all required variables are set."
  );
}

export const adapter = new SlackAdapter({
  clientSigningSecret: process.env.SLACK_CLIENT_SIGNING_SECRET,
  botToken: process.env.SLACK_BOT_TOKEN,
});

adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());
