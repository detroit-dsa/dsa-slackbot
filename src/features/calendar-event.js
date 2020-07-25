import * as createMeeting from "../calendar-event/actions/create-meeting";

const newMeetingTriggers = ["zoom", "meeting"];
const cancelTriggers = ["quit", "cancel", "never mind", "nevermind"];

export default function (controller) {
  createMeeting.attachDialog(controller);

  controller.on("app_mention", appMentionHandler);
  controller.hears(newMeetingTriggers, "direct_message", newMeetingDmHandler);
  controller.interrupts(cancelTriggers, "direct_message", cancelHandler);

  // attachListEventsDialog(controller);
  // controller.hears("list", "message,direct_mention,direct_message", async (bot, _message) => {
  //   bot.say("Looking up the next 10 events from Zoom...");
  //   await bot.beginDialog(LIST_CALENDAR_EVENTS_DIALOG_ID);
  // });
}

const appMentionHandler = async (bot, message) => {
  console.log(`Heard a mention from ${message.user}`);

  const mentionText = message.incoming_message.channelData.text;
  if (newMeetingTriggers.some((t) => mentionText.includes(t))) {
    try {
      await bot.reply(
        message,
        `<@${message.incoming_message.from.id}> I'll DM you to get the details.`
      );
    } catch (error) {
      console.error(error);
    }

    await createMeeting.beginDialog(bot, message.user);
  }
};

const newMeetingDmHandler = async (bot, message) => {
  console.log(`Heard a direct message from ${message.user}`);
  await createMeeting.beginDialog(bot, message.user);
};

const cancelHandler = async (bot, message) => {
  await bot.reply(message, "OK, never mind.");
  await bot.cancelAllDialogs();
};
