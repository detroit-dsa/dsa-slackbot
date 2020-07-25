// dotenv must be loaded before controller, so this part is tricky with ES6 imports.
// Just use plain old require() instead.
require("dotenv").config();
const controller = require("./controller").controller;

controller.ready(() => {
  controller.loadModules(__dirname + "/features");
});
