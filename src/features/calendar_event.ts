import { Botkit, BotkitConversation, BotkitDialogWrapper, BotWorker } from "botkit";
import * as chrono from 'chrono-node';
import { ZoomApiClient } from "../calendar-event/zoom";
import { ZoomCreateMeetingRequest } from "../calendar-event/zoom/api-interfaces/ZoomCreateMeetingRequest";
import { ZoomMeetingType } from "../calendar-event/zoom/api-interfaces/ZoomMeetingType";

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
  const createEventConvo = buildCreateEventDialog(controller);
  controller.addDialog(createEventConvo);

  const listEventsConvo = buildListEventsDialog(controller);
  controller.addDialog(listEventsConvo);

  controller.hears('event', 'message,direct_mention,direct_message', async (bot, _message) => {
    await bot.beginDialog(CREATE_CALENDAR_EVENT_DIALOG_ID);
  });

  controller.hears('list', 'message,direct_mention,direct_message', async (bot, _message) => {
    bot.say("Looking up the next 10 events from Zoom...");
    await bot.beginDialog(LIST_CALENDAR_EVENTS_DIALOG_ID);
  });
}

function buildListEventsDialog(
  controller: Botkit
): BotkitConversation<{}> {
  const convo = new BotkitConversation(LIST_CALENDAR_EVENTS_DIALOG_ID, controller);
  convo.addAction("list_events");

  convo.before("list_events", async (convo, _bot) => {
    const zoomMeetings = await zoomClient.getScheduledMeetings();
    // const googleEvents = await googleCalendarClient.getEvents();

    const meetingsString = zoomMeetings.meetings
      .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
      .map(m => `${new Date(m.start_time).toLocaleString()} **${m.topic.trim()}**`)
      .join("\n\n");
    convo.setVar('list_meetings_content', meetingsString);
  });

  convo.addMessage("{{vars.list_meetings_content}}", "list_events");

  controller.addDialog(convo);
  return convo;
}

function buildCreateEventDialog(
  controller: Botkit
): BotkitConversation<{}> {
  const convo = new BotkitConversation(CREATE_CALENDAR_EVENT_DIALOG_ID, controller);

  convo.ask(
    {
      text: ["Want to create a new calendar event?"],
      quick_replies: quickReplyYesNo
    },
    [
      {
        pattern: 'yes',
        handler: async (_answer: string, convo: BotkitDialogWrapper, _bot: BotWorker) => {
          await convo.gotoThread('create_event');
        }
      },
      {
        default: true,
        handler: async (_answer: string, convo: BotkitDialogWrapper, _bot: BotWorker) => {
          await convo.gotoThread('cancel');
        }
      }
    ],
    null
  );

  addCreateEventThread(convo);
  addCancelThread(convo);
  addCompleteThread(convo);

  controller.addDialog(convo);
  return convo;
}

function addCreateEventThread(
  convo: BotkitConversation<{}>
): void {
  convo.addQuestion("What's the title of your event?", noopConvoHandler, { key: 'title' }, 'create_event');
  convo.addQuestion("OK. Next, write a few sentences to describe your event.", noopConvoHandler, { key: 'description' }, 'create_event');

  convo.addQuestion(
    "When will the event happen? For example, say \"Friday from 5 to 6 PM\", \"March 1st, noon to 3\", or \"tomorrow at 8am to 8:30\".",
    async (res, convo, bot) => {
      const date = chrono.parse(res);

      if (!date || date.length != 1 || !date[0].end) {
        bot.say("I didn't understand, or maybe you left out the end time. Try again.")
        await convo.repeat();
      }
      else {
        convo.setVar('event_time', date[0]);
        convo.setVar('event_time_start', date[0].start.date().toLocaleString());
        convo.setVar('event_time_end', date[0].end.date().toLocaleTimeString());
      }
    },
    null,
    'create_event'
  );

  convo.addMessage("OK, here's the event I'll make.", 'create_event');
  convo.addMessage("**Title:** {{vars.title}}\n\n"
    + "**Description:** {{vars.description}}\n\n"
    + "**Time:** {{vars.event_time_start}} - {{vars.event_time_end}}",
    'create_event');

  convo.addQuestion(
    {
      text: ["Look good?"],
      quick_replies: quickReplyYesNo
    },
    [
      {
        pattern: 'yes',
        handler: async (_answer: string, convo, bot) => {
          bot.say("Creating your event in Zoom and Google Calendar...");
          convo.gotoThread('complete');
        }
      },
      {
        default: true,
        handler: async (_answer: string, convo: BotkitDialogWrapper, bot: BotWorker) => {
          bot.say("OK, let's try that again.");
          convo.gotoThread('create_event');
        }
      }
    ],
    'approved',
    'create_event');
}

function addCompleteThread(
  convo: BotkitConversation<{}>
) {
  convo.addMessage("👍 Created Zoom event.", "complete");

  // TODO: Zoom and Google calendar events

  // convo.before("complete", async (convo, _bot) => {
  //   const startTime = convo.vars.event_time.start.date();
  //   const durationMinutes = Math.ceil((convo.vars.event_time.start.date() - convo.vars.event_time.end.date()) / 6000);

  //   const createZoomMeetingRequest: ZoomCreateMeetingRequest = {
  //     topic: convo.vars.title,
  //     agenda: convo.vars.description,
  //     start_time: startTime,
  //     duration: durationMinutes,
  //     timezone: "America/Detroit",
  //     type: ZoomMeetingType.Scheduled
  //   };

  //   await zoomClient.createMeeting(createZoomMeetingRequest)
  // });


  convo.addAction("complete", "complete");
}

function addCancelThread(
  convo: BotkitConversation<{}>
) {
  convo.addMessage("OK, never mind.", "cancel");
  convo.addAction("stop", "cancel");
}

