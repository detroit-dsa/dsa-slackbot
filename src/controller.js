import { Botkit } from "botkit";
import { receiveMiddleware, sendMiddleware } from "./middleware";
import { adapter } from "./slack-adapter";

export const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter: adapter,
});

controller.middleware.receive.use(receiveMiddleware);
controller.middleware.send.use(sendMiddleware);
