import "dotenv/config";
import { controller } from "./bot-controller";

controller.ready(() => {
  controller.loadModules(__dirname + "/features");
});
