import { Botkit, BotkitConversation, BotkitDialogWrapper, BotWorker } from "botkit";
import * as chrono from 'chrono-node';

const GENERIC_CALENDAR_EVENT_ID = "event";
const CREATE_CALENDAR_EVENT_ID = "create_event";

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

export default function (controller: Botkit) {
  const eventConvo = buildEventDialog(controller);
  controller.addDialog(eventConvo);

  controller.hears('event', 'message,direct_mention,direct_message', async (bot, _message) => {
    await bot.beginDialog(GENERIC_CALENDAR_EVENT_ID);
  });
}

function buildEventDialog(controller: Botkit): BotkitConversation<{}> {
  const convo = new BotkitConversation(GENERIC_CALENDAR_EVENT_ID, controller);

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
  convo.addChildDialog(CREATE_CALENDAR_EVENT_ID, 'create_event');

  addCancelThread(convo);
  addCompleteThread(convo);

  controller.addDialog(convo);
  return convo;
}

function addCreateEventThread(convo: BotkitConversation<{}>): void {
  convo.addQuestion("What's the title of your event?", noopConvoHandler, { key: 'title' }, 'create_event');
  convo.addQuestion("OK. Next, write a few sentences to describe your event.", noopConvoHandler, { key: 'description' }, 'create_event');

  convo.addQuestion(
    "When will the event happen?\n\n"
    + "**Example:** Friday from 5 to 6 PM.\n\n"
    + "**Example:** March 1st, noon to 3\n\n"
    + "**Example:** Today at 6:00",
    async (res, _convo, bot) => {
      const date = chrono.parse(res);
      bot.say(JSON.stringify(date));
    },
    'event_time',
    'create_event'
  );

  convo.addMessage("Here's the event I'll make.", 'create_event');
  convo.addMessage("**Title:** {{vars.title}}\n\n"
    + "**Description:** {{vars.description}}\n\n"
    + "**Time:** " + convo.vars.event_time //{{vars.event_time}}",
    'create_event');

  convo.addQuestion(
    {
      text: ["Look good?"],
      quick_replies: quickReplyYesNo
    },
    [
      {
        pattern: 'yes',
        handler: async (_answer: string, convo, _bot) => {
          convo.gotoThread('complete');
        }
      },
      {
        default: true,
        handler: async (_answer: string, convo: BotkitDialogWrapper, bot: BotWorker) => {
          bot.say("OK, let's try again.");
          convo.gotoThread('create_event');
        }
      }
    ],
    'approved',
    'create_event');
}

function addCompleteThread(convo: BotkitConversation<{}>) {
  convo.addMessage("👍", "complete");
  // TODO: Actually create calendar events and stuff here
  convo.addAction("complete", "complete");
}

function addCancelThread(convo: BotkitConversation<{}>) {
  convo.addMessage("OK, never mind.", "cancel");
  convo.addAction("stop", "cancel");
}

