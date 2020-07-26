import * as createMeeting from "./calendar-event/actions/create-meeting";
import { CREATE_MEETING_TRIGGERS } from "./calendar-event";
import { HELP_TRIGGERS, helpHandler } from "./help";

// There's no hears() function for app_mention events, so send them all through
// here instead of handling them in the individual features.
export default function (controller) {
  controller.on("app_mention", appMentionHandler);
}

async function appMentionHandler(bot, message) {
  const mentionText = message.incoming_message.channelData.text;
  console.log(`Heard a mention from ${message.user}: "${mentionText}"`);

  if (textIncludesTrigger(mentionText, CREATE_MEETING_TRIGGERS)) {
    await beginCreateMeetingDialog(bot, message);
  }

  if (textIncludesTrigger(mentionText, HELP_TRIGGERS)) {
    await helpHandler(bot);
  }
}

function textIncludesTrigger(text, triggers) {
  return triggers.some((t) => text.includes(t));
}

async function beginCreateMeetingDialog(bot, message) {
  const mentionReply = `<@${message.user}> I'll DM you to get the details.`;

  try {
    await bot.reply(message, mentionReply);
  } catch (error) {
    console.error(error);
  }

  await createMeeting.beginDialog(bot, message.user);
}
