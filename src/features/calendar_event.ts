import { Botkit, BotkitConversation, BotkitDialogWrapper, BotWorker } from "botkit";
import * as chrono from "chrono-node";
import { ZoomApiClient } from "../calendar-event/zoom";
import { ZoomMeetingType } from "../calendar-event/zoom/api-interfaces/ZoomMeetingType";
import { ZoomCreateMeetingRequest } from "../calendar-event/zoom/api-interfaces/ZoomMeeting";

const CREATE_CALENDAR_EVENT_DIALOG_ID = "create_event";
const LIST_CALENDAR_EVENTS_DIALOG_ID = "list_events";

const zoomClient = new ZoomApiClient(process.env.ZOOM_JWT);
// const googleCalendarClient = new GoogleCalendarApiClient();

const quickReplyYesNo = [
  {
    title: "Yes",
    payload: "yes"
  },
  {
    title: "No",
    payload: "no"
  }
];

const noopConvoHandler = async (_answer: string, _convo: BotkitDialogWrapper, _bot: BotWorker): Promise<void> => { };

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
      const parsedDate = chrono.parse(res);

      if (!parsedDate || parsedDate.length != 1 || !parsedDate[0].end) {
        bot.say("I didn't understand, or maybe you left out the end time. Try again.")
        await convo.repeat();
      }
      else {
        convo.setVar("event_time_start", parsedDate[0].start.date().toLocaleString());
        convo.setVar("event_time_end", parsedDate[0].end.date().toLocaleTimeString());
      }
    },
    { key: "event_time_text" }
  );

  convo.say("OK, here's the event I'll make.");

  convo.say(`
**Title:** {{vars.title}}

**Description:** {{vars.description}}

**Time:** {{vars.event_time_start}} - {{vars.event_time_end}}`
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
          bot.say("Creating your event in Zoom...");
          convo.gotoThread("finish");
        }
      },
      {
        default: true,
        handler: async (_answer, convo, bot) => {
          bot.say("OK, let's try that again.");
          convo.gotoThread("create_event");
        }
      }
    ],
    "approved"
  );
}

function addFinishThread(
  convo: BotkitConversation<{}>
) {
  convo.addMessage(
    `👍 Created Zoom event.



**Title:** {{vars.title}}

**Time:** {{vars.event_time_start}} - {{vars.event_time_end}}

**Host URL:** (For host use only!) {{vars.host_url}}

**Join URL:** (Share this around) {{vars.join_url}}`,
    "finish"
  );

  convo.before("finish", async (convo, _bot) => {
    const parsedDate = chrono.parse(convo.vars.event_time_text)[0];
    const startTime = parsedDate.start.date();
    const durationMinutes = Math.ceil((+parsedDate.end.date() - +parsedDate.start.date()) / 60000);

    const createZoomMeetingRequest: ZoomCreateMeetingRequest = {
      topic: convo.vars.title,
      agenda: convo.vars.description,
      start_time: getLocalISOString(startTime),
      duration: durationMinutes,
      timezone: "America/New_York",
      type: ZoomMeetingType.Scheduled
    };

    const zoomResponse = await zoomClient.createMeeting(createZoomMeetingRequest);
    convo.setVar("host_url", zoomResponse.start_url);
    convo.setVar("join_url", zoomResponse.join_url);

    // TODO: Google calendar event
  });

  convo.addAction("complete", "finish");
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
