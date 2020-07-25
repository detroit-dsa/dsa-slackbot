export const HELP_TRIGGERS = ["help"];
export const helpMessages = ["Say *help* to show this help message."];

export default function (controller) {
  controller.hears(HELP_TRIGGERS, "direct_message", helpHandler);
}

export async function helpHandler(bot) {
  const helpMessage =
    "Here's what I know how to do:\n" + helpMessages.join("\n");

  await bot.say(helpMessage);
}
