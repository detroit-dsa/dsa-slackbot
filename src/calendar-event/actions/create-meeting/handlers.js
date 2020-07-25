import * as chrono from "chrono-node";
import * as api from "../../api";
import { getLocalISOString, generatePassword } from "../../../shared/io-helper";

export async function noop() {}

export async function retry(_answer, convo, bot) {
  bot.say("OK, let's try that again.");
  convo.gotoThread("default");
}

export async function timeInput(res, convo, bot) {
  const parsedDate = chrono.parse(res, new Date(), { forwardDate: true });

  if (!parsedDate || parsedDate.length != 1 || !parsedDate[0].end) {
    bot.say(
      "I didn't understand, or maybe you left out the end time. Try again."
    );

    await convo.repeat();
  } else {
    const startDateAndTimeString = parsedDate[0].start
      .date()
      .toLocaleString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    convo.setVar("event_time_start", startDateAndTimeString);

    const endTimeString = parsedDate[0].end
      .date()
      .toLocaleString([], { hour: "2-digit", minute: "2-digit" });
    convo.setVar("event_time_end", endTimeString);
  }
}

export async function confirm(_answer, convo, bot) {
  bot.say("Creating your meeting in Zoom and Google Calendar...");
  convo.gotoThread("finish");
}

export async function createMeeting(convo) {
  const parsedDate = chrono.parse(convo.vars.event_time_text, new Date(), {
    forwardDate: true,
  })[0];

  const startTime = parsedDate.start.date();

  const durationMinutes = Math.ceil(
    (+parsedDate.end.date() - +parsedDate.start.date()) / 60000
  );

  const startTimeISO = getLocalISOString(startTime);
  let zoomResponse = await api.createZoomMeeting(
    convo,
    startTimeISO,
    durationMinutes,
    generatePassword(8)
  );

  const endTimeISO = getLocalISOString(parsedDate.end.date());
  await api.createGcalEvent(
    convo,
    startTimeISO,
    endTimeISO,
    zoomResponse.join_url
  );
}
