const CANCEL_TRIGGERS = ["quit", "cancel", "never mind", "nevermind"];

export default function (controller) {
  controller.interrupts(CANCEL_TRIGGERS, "direct_message", cancelHandler);
}

async function cancelHandler(bot, message) {
  console.log(`Heard a cancel request from ${message.user}: "${message.text}"`);

  await bot.reply(message, "OK, never mind.");
  await bot.cancelAllDialogs();
}
