// Required event subscriptions:
// - app_mention
// - message.im

// Required permission scopes:
// - app_mentions:read
// - chat:write
// - im:read
// - im:write
// - mpim:write

import * as createMeeting from "../calendar-event/actions/create-meeting";
import { helpMessages } from "./help";

helpMessages.push(
  "Message me *zoom* or *meeting* to schedule a Zoom meeting."
);

export const CREATE_MEETING_TRIGGERS = ["zoom", "meeting"];

export default function (controller) {
  createMeeting.attachDialog(controller);

  controller.hears(
    CREATE_MEETING_TRIGGERS,
    "direct_message",
    createMeetingDmHandler
  );

  // attachListEventsDialog(controller);
  // controller.hears("list", "message,direct_mention,direct_message", async (bot, _message) => {
  //   bot.say("Looking up the next 10 events from Zoom...");
  //   await bot.beginDialog(LIST_CALENDAR_EVENTS_DIALOG_ID);
  // });
}

async function createMeetingDmHandler(bot, message) {
  console.log(
    `Heard a meeting request from ${message.user}: "${message.text}"`
  );
  await createMeeting.beginDialog(bot, message.user);
}
