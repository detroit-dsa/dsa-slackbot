import { Botkit, BotkitConversation } from "botkit";
import * as chrono from "chrono-node";
import { ZoomApiClient } from "../calendar-event/zoom";
import { ZoomMeetingType } from "../calendar-event/zoom/api-interfaces/ZoomMeetingType";
import { ZoomCreateMeetingRequest } from "../calendar-event/zoom/api-interfaces/ZoomMeeting";
import { ZoomMeetingApprovalType } from "../calendar-event/zoom/api-interfaces/ZoomMeetingApprovalType";
import { GoogleCalendarApiClient } from "../calendar-event/google-calendar";

const CREATE_CALENDAR_EVENT_DIALOG_ID = "create_event";
const LIST_CALENDAR_EVENTS_DIALOG_ID = "list_events";

const zoomClient = new ZoomApiClient(process.env.ZOOM_JWT);
const googleCalendarClient = new GoogleCalendarApiClient(process.env.GOOGLE_CALENDAR_ID!, process.env.GOOGLE_JSON_CRED_PATH!);

const noopConvoHandler = async () => { };
const quickReplyYesNo = [{ title: "Yes", payload: "yes" }, { title: "No", payload: "no" }];

export default function (
  controller: Botkit
) {
  addCreateEventDialog(controller);
  addListEventsDialog(controller);

  controller.hears("event", "message,direct_mention,direct_message", async (bot, _message) => {
    await bot.beginDialog(CREATE_CALENDAR_EVENT_DIALOG_ID);
  });

  controller.hears("list", "message,direct_mention,direct_message", async (bot, _message) => {
    bot.say("Looking up the next 10 events from Zoom...");
    await bot.beginDialog(LIST_CALENDAR_EVENTS_DIALOG_ID);
  });
}

function addListEventsDialog(
  controller: Botkit
): BotkitConversation<{}> {
  const convo = new BotkitConversation(LIST_CALENDAR_EVENTS_DIALOG_ID, controller);
  convo.addAction("list_events");

  convo.before(
    "list_events",
    async (convo, _bot) => {
      const zoomMeetings = await zoomClient.getScheduledMeetings();
      // const googleEvents = await googleCalendarClient.getEvents();

      const meetingsString = zoomMeetings.meetings
        .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
        .map(m => `${new Date(m.start_time).toLocaleString()} **${m.topic.trim()}**`)
        .join("\n\n");

      convo.setVar("list_meetings_content", meetingsString);
    });

  convo.addMessage(
    "{{vars.list_meetings_content}}",
    "list_events"
  );

  controller.addDialog(convo);
  return convo;
}

function addCreateEventDialog(
  controller: Botkit
): BotkitConversation<{}> {
  const convo = new BotkitConversation(CREATE_CALENDAR_EVENT_DIALOG_ID, controller);
  addCreateEventThread(convo);
  addCancelThread(convo);
  addFinishThread(convo);

  controller.addDialog(convo);
  return convo;
}

function addCreateEventThread(
  convo: BotkitConversation<{}>
) {
  convo.ask(
    "What's the title of your event?",
    noopConvoHandler,
    { key: "title" }
  );

  convo.ask(
    "OK. Next, write a few sentences to describe your event.",
    noopConvoHandler,
    { key: "description" }
  );

  convo.ask(
    "When will the event happen? For example, say \"Friday from 5 to 6 PM\", \"March 1st, noon to 3\", or \"tomorrow at 8am to 8:30\".",
    async (res, convo, bot) => {
      const parsedDate = chrono.parse(res, new Date(), { forwardDate: true });

      if (!parsedDate || parsedDate.length != 1 || !parsedDate[0].end) {
        bot.say("I didn't understand, or maybe you left out the end time. Try again.")
        await convo.repeat();
      }
      else {
        convo.setVar("event_time_start", parsedDate[0].start.date().toLocaleString([], { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }));
        convo.setVar("event_time_end", parsedDate[0].end.date().toLocaleString([], { hour: "2-digit", minute: "2-digit" }));
      }
    },
    { key: "event_time_text" }
  );

  convo.say("OK, here's the event I'll make.");

  convo.say(`
**Title:** {{vars.title}}<br />
**Time:** {{vars.event_time_start}} - {{vars.event_time_end}}<br />
**Description:** {{vars.description}}`
  );

  convo.ask(
    {
      text: ["Look good?"],
      quick_replies: quickReplyYesNo
    },
    [
      {
        pattern: "yes",
        handler: async (_answer, convo, bot) => {
          bot.say("Creating your event in Zoom and Google Calendar...");
          convo.gotoThread("finish");
        }
      },
      {
        default: true,
        handler: async (_answer, convo, bot) => {
          bot.say("OK, let's try that again.");
          convo.gotoThread("default");
        }
      }
    ],
    "approved"
  );
}

function addFinishThread(
  convo: BotkitConversation<{}>
) {
  convo.addAction("finish");

  convo.before("finish", async (convo, _bot) => {
    const parsedDate = chrono.parse(convo.vars.event_time_text, new Date(), { forwardDate: true })[0];
    const startTime = parsedDate.start.date();
    const durationMinutes = Math.ceil((+parsedDate.end.date() - +parsedDate.start.date()) / 60000);
    const password = generatePassword(8);

    const startTimeISO = getLocalISOString(startTime);
    const endTimeISO = getLocalISOString(parsedDate.end.date());

    const createZoomMeetingRequest: ZoomCreateMeetingRequest = {
      topic: convo.vars.title,
      agenda: convo.vars.description,
      start_time: startTimeISO,
      duration: durationMinutes,
      timezone: "America/New_York",
      type: ZoomMeetingType.Scheduled,
      password: password,
      settings: {
        approval_type: ZoomMeetingApprovalType.NoRegistrationRequired,
        join_before_host: true,
        waiting_room: false,
        mute_upon_entry: true
      }
    };

    const zoomResponse = await zoomClient.createMeeting(createZoomMeetingRequest);
    convo.setVar("host_url", zoomResponse.start_url);
    convo.setVar("join_url", zoomResponse.join_url);
    convo.setVar("password", password);

    const gcalDescription = `${convo.vars.description}
<hr /><b>Join Zoom meeting:</b> ${convo.vars.join_url}
<b>Password:</b> ${convo.vars.password}`;

    const gcalResponse = await googleCalendarClient.addEvent(
      {
        summary: convo.vars.title,
        description: gcalDescription,
        start: {
          dateTime: startTimeISO,
          timeZone: "America/New_York"
        },
        end: {
          dateTime: endTimeISO,
          timeZone: "America/New_York"
        },
        location: zoomResponse.join_url
      }
    );

   convo.setVar("calendar_link", gcalResponse.data.htmlLink);

    console.log(gcalResponse);
  });

  convo.addMessage(
    `👍 I created your event.

**Host link**
<br />
Keep this private! Use it to start the meeting as the host.

{{vars.host_url}}

**Share with attendees**

{{vars.calendar_link}}

{{vars.title}}<br />
{{vars.event_time_start}} - {{vars.event_time_end}}

{{vars.description}}

Join Zoom meeting: {{vars.join_url}}<br />
Password: {{vars.password}}`,
    "finish"
  );

  convo.addAction("complete", "finish");
}

function generatePassword(
  length: number
): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

function getLocalISOString(
  date: Date
): string {
  const yyyy = date.getFullYear();
  const MM = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
}

function addCancelThread(
  convo: BotkitConversation<{}>
) {
  convo.addMessage("OK, never mind.", "cancel");
  convo.addAction("stop", "cancel");
}
