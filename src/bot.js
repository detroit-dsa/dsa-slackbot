import { controller } from "./controller";
require("dotenv").config();

controller.ready(() => {
  controller.loadModules(__dirname + "/features");
});
