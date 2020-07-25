import { Botkit } from "botkit";
import { adapter } from "./slack-adapter";
import * as middleware from "./middleware";

export const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter: adapter,
});

controller.middleware.receive.use(middleware.receive);
controller.middleware.send.use(middleware.send);
