import { BotkitConversation } from "botkit";
import * as chrono from "chrono-node";
import {
  ZoomApiClient,
  ZoomMeetingType,
  ZoomMeetingApprovalType,
} from "../calendar-event/zoom";
import { GoogleCalendarApiClient } from "../calendar-event/google-calendar";

if (
  !process.env.ZOOM_JWT ||
  !process.env.GOOGLE_CALENDAR_ID ||
  !process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL ||
  !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
) {
  throw (
    "Required environment variables for Zoom or Google Calendar are not defined. " +
    "Please check the documentation and ensure that all required variables are set."
  );
}

const CREATE_CALENDAR_EVENT_DIALOG_ID = "create_event";
const LIST_CALENDAR_EVENTS_DIALOG_ID = "list_events";
const TIME_ZONE = "America/New_York";

const zoomClient = new ZoomApiClient(process.env.ZOOM_JWT);
const googleCalendarClient = new GoogleCalendarApiClient(
  process.env.GOOGLE_CALENDAR_ID,
  process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
);

const noopConvoHandler = async () => {};
const triggers = ["zoom", "meeting"];

export default function (controller) {
  addCreateEventDialog(controller);
  addListEventsDialog(controller);

  controller.on("app_mention", async (bot, message) => {
    const mentionText = message.incoming_message.channelData.text;
    if (triggers.some((t) => mentionText.includes(t))) {
      try {
        await bot.replyEphemeral(message, "I'll DM you to get the details.");
      } catch (error) {
        console.error(error);
      }

      await startCreateEventDialog(bot, message.user);
    }
  });

  controller.hears(triggers, ["direct_message"], async (bot, message) => {
    await startCreateEventDialog(bot, message.user);
  });

  controller.interrupts(
    ["quit", "cancel", "never mind", "nevermind"],
    "direct_message",
    async (bot, message) => {
      await bot.reply(message, "OK, never mind.");
      await bot.cancelAllDialogs();
    }
  );

  // controller.hears("list", "message,direct_mention,direct_message", async (bot, _message) => {
  //   bot.say("Looking up the next 10 events from Zoom...");
  //   await bot.beginDialog(LIST_CALENDAR_EVENTS_DIALOG_ID);
  // });
}

async function startCreateEventDialog(bot, userId) {
  try {
    await bot.startPrivateConversation(userId);
  } catch (error) {
    console.error(error);
  }

  await bot.beginDialog(CREATE_CALENDAR_EVENT_DIALOG_ID);
}

function addListEventsDialog(controller) {
  const convo = new BotkitConversation(
    LIST_CALENDAR_EVENTS_DIALOG_ID,
    controller
  );
  convo.addAction("list_events");

  convo.before("list_events", async (convo) => {
    let zoomMeetings = [];
    let googleEvents = [];
    try {
      zoomMeetings = await zoomClient.getScheduledMeetings();
      // googleEvents = await googleCalendarClient.getEvents();
    } catch (error) {
      console.error("Failed while trying to retrieve meetings.", error);
    }

    if (!zoomMeetings) {
      return;
    }

    const meetingsString = zoomMeetings.meetings
      .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
      .map(
        (m) =>
          `${new Date(m.start_time).toLocaleString()} **${m.topic.trim()}**`
      )
      .join("\n\n");

    convo.setVar("list_meetings_content", meetingsString);
  });

  convo.addMessage("{{vars.list_meetings_content}}", "list_events");

  controller.addDialog(convo);
  return convo;
}

function addCreateEventDialog(controller) {
  const convo = new BotkitConversation(
    CREATE_CALENDAR_EVENT_DIALOG_ID,
    controller
  );
  addCreateEventThread(convo);
  addCancelThread(convo);
  addFinishThread(convo);

  controller.addDialog(convo);
  return convo;
}

function addCreateEventThread(convo) {
  convo.ask(
    "Let's get your meeting on the calendar. What's the title of the meeting?",
    noopConvoHandler,
    { key: "title" }
  );

  convo.ask(
    "OK. Next, write a few sentences to describe the meeting.",
    noopConvoHandler,
    { key: "description" }
  );

  convo.ask(
    'When will the meeting happen? For example, say "Friday from 5 to 6 PM", "March 1st, noon to 3", or "tomorrow at 8am to 8:30".',
    async (res, convo, bot) => {
      const parsedDate = chrono.parse(res, new Date(), { forwardDate: true });

      if (!parsedDate || parsedDate.length != 1 || !parsedDate[0].end) {
        bot.say(
          "I didn't understand, or maybe you left out the end time. Try again."
        );
        await convo.repeat();
      } else {
        convo.setVar(
          "event_time_start",
          parsedDate[0].start.date().toLocaleString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        convo.setVar(
          "event_time_end",
          parsedDate[0].end
            .date()
            .toLocaleString([], { hour: "2-digit", minute: "2-digit" })
        );
      }
    },
    { key: "event_time_text" }
  );

  convo.say("OK, here's the meeting I'll make.");

  convo.say(`
*Title:* {{vars.title}}
*Time:* {{vars.event_time_start}} - {{vars.event_time_end}}
*Description:* {{vars.description}}`);

  const yesHandler = async (_answer, convo, bot) => {
    bot.say("Creating your meeting in Zoom and Google Calendar...");
    convo.gotoThread("finish");
  };

  convo.ask(
    {
      text: ["Look good?"],
    },
    [
      { pattern: "ok", handler: yesHandler },
      { pattern: "yep", handler: yesHandler },
      { pattern: "sure", handler: yesHandler },
      { pattern: "yeah", handler: yesHandler },
      { pattern: "yes", handler: yesHandler },
      {
        default: true,
        handler: async (_answer, convo, bot) => {
          bot.say("OK, let's try that again.");
          convo.gotoThread("default");
        },
      },
    ],
    "approved"
  );
}

function addFinishThread(convo) {
  convo.addAction("finish");

  convo.before("finish", async (convo) => {
    const parsedDate = chrono.parse(convo.vars.event_time_text, new Date(), {
      forwardDate: true,
    })[0];
    const startTime = parsedDate.start.date();
    const durationMinutes = Math.ceil(
      (+parsedDate.end.date() - +parsedDate.start.date()) / 60000
    );
    const password = generatePassword(8);

    const startTimeISO = getLocalISOString(startTime);
    const endTimeISO = getLocalISOString(parsedDate.end.date());

    const createZoomMeetingRequest = {
      topic: convo.vars.title,
      agenda: convo.vars.description,
      start_time: startTimeISO,
      duration: durationMinutes,
      timezone: TIME_ZONE,
      type: ZoomMeetingType.Scheduled,
      password: password,
      settings: {
        approval_type: ZoomMeetingApprovalType.NoRegistrationRequired,
        join_before_host: true,
        waiting_room: false,
        mute_upon_entry: true,
      },
    };

    let zoomResponse;
    try {
      zoomResponse = await zoomClient.createMeeting(createZoomMeetingRequest);
      convo.setVar("host_url", zoomResponse.start_url);
      convo.setVar("join_url", zoomResponse.join_url);
      convo.setVar("password", password);
    } catch (error) {
      console.error("Failed to add to Zoom.", error);
    }

    const gcalDescription = `${convo.vars.description}

Join Zoom meeting: ${convo.vars.join_url}
Password: ${convo.vars.password}`;

    try {
      const gcalResponse = await googleCalendarClient.addEvent({
        summary: convo.vars.title,
        description: gcalDescription,
        start: {
          dateTime: startTimeISO,
          timeZone: TIME_ZONE,
        },
        end: {
          dateTime: endTimeISO,
          timeZone: TIME_ZONE,
        },
        location: zoomResponse.join_url,
      });

      convo.setVar("calendar_link", gcalResponse.data.htmlLink);
    } catch (error) {
      console.error("Failed to add to Google Calendar.", error);
    }
  });

  convo.addMessage("👍 I created your event.", "finish");
  convo.addMessage(
    `*Host link*
Keep this private! Use it to start the meeting and gain host privileges.
>⚡ <{{vars.host_url}}|Start "{{vars.title}}" as host>`,
    "finish"
  );
  convo.addMessage(
    `*Share with attendees*
<{{vars.calendar_link}}|"{{vars.title}}" on Google Calendar>
>*{{vars.title}}*
>{{vars.event_time_start}} - {{vars.event_time_end}}
>
>{{vars.description}}
>
>---
>Join Zoom meeting: <{{vars.join_url}}>
>Password: {{vars.password}}`,
    "finish"
  );

  convo.addAction("complete", "finish");
}

function generatePassword(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

function getLocalISOString(date) {
  const yyyy = date.getFullYear();
  const MM = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
}

function addCancelThread(convo) {
  convo.addMessage("OK, never mind.", "cancel");
  convo.addAction("stop", "cancel");
}
