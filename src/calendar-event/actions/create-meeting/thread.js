import * as handlers from "./handlers";

export function attachMainThread(convo) {
  convo.ask(
    "Let's get your meeting on the calendar. What's the title of the meeting?",
    handlers.noop,
    { key: "title" }
  );

  convo.ask(
    "OK. Next, write a few sentences to describe the meeting.",
    handlers.noop,
    { key: "description" }
  );

  convo.ask(
    'When will the meeting happen? For example, say "Friday from 5 to 6 PM", "March 1st, noon to 3", or "tomorrow at 8am to 8:30".',
    handlers.timeInput,
    { key: "event_time_text" }
  );

  convo.say("OK, here's the meeting I'll make.");

  convo.say(`*Title:* {{vars.title}}
*Time:* {{vars.event_time_start}} - {{vars.event_time_end}}
*Description:* {{vars.description}}`);

  convo.ask(
    "Look good?",
    [
      { pattern: "ok", handler: handlers.confirm },
      { pattern: "yep", handler: handlers.confirm },
      { pattern: "sure", handler: handlers.confirm },
      { pattern: "yeah", handler: handlers.confirm },
      { pattern: "yes", handler: handlers.confirm },
      {
        default: true,
        handler: handlers.retry,
      },
    ],
    "approved"
  );
}

const FINISH_THREAD_ID = "finish";
export function attachFinishThread(convo) {
  convo.addAction(FINISH_THREAD_ID);

  convo.before(FINISH_THREAD_ID, handlers.createMeeting);

  convo.addMessage("👍 I created your event.", FINISH_THREAD_ID);
  convo.addMessage(
    `*Host link*
Keep this private! Use it to start the meeting and gain host privileges.
>⚡ <{{vars.host_url}}|Start "{{vars.title}}" as host>`,
    FINISH_THREAD_ID
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
    FINISH_THREAD_ID
  );

  convo.addAction("complete", FINISH_THREAD_ID);
}
