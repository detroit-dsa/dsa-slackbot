import { Botkit } from "botkit";
import { WebAdapter } from "botbuilder-adapter-web";

require("dotenv").config();

const controller = new Botkit({
  webhook_uri: "/api/messages",
  adapter: new WebAdapter({})
});

controller.ready(() => {
  controller.loadModules(__dirname + "/features");
});
