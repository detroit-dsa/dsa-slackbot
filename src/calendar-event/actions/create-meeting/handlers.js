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

  if (!parsedDate || parsedDate.length != 1) {
    await bot.say("Sorry, I didn't understand. Try again.");

    await convo.repeat();
  } else if (!parsedDate[0].end) {
    await bot.say(
      "I understood the start time, but I also need to know when the meeting should end. Please try again."
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
  const startDate = parsedDate.start.date();
  const endDate = parsedDate.end.date();

  const startTimeISO = getLocalISOString(startDate);
  const durationMinutes = Math.ceil((+endDate - +startDate) / 60000);
  const password = generatePassword(8);

  let zoomResponse = await api.createZoomMeeting(
    convo.vars.title,
    convo.vars.description,
    startTimeISO,
    durationMinutes,
    password
  );
  convo.setVar("host_url", zoomResponse.start_url);
  convo.setVar("join_url", zoomResponse.join_url);
  convo.setVar("password", password);

  const endTimeISO = getLocalISOString(endDate);
  const gcalResponse = await api.createGcalEvent(
    convo.vars.title,
    convo.vars.description,
    password,
    zoomResponse.join_url,
    startTimeISO,
    endTimeISO
  );
  convo.setVar("calendar_link", gcalResponse.data.htmlLink);
}
