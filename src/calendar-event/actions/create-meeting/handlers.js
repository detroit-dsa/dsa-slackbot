import * as chrono from "chrono-node";
import * as api from "../../api";
import { getLocalISOString, generatePassword } from "../../../shared/io-helper";
import { ZoomRecurrenceType } from "../../api/zoom";

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
    const startDate = parsedDate[0].start.date();
    const startDateAndTimeString = startDate.toLocaleString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    convo.setVar("event_time_start_iso", startDate);
    convo.setVar("event_time_start", startDateAndTimeString);

    const endDate = parsedDate[0].end.date();
    const endTimeString = endDate.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    convo.setVar("event_time_end", endTimeString);
  }
}

const RRULE_WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const recurrenceOptions = ["no", "weekly", "monthly"];
export async function recurrenceInput(res, convo, bot) {
  if (!recurrenceOptions.some((r) => res.trim() == r)) {
    await bot.say("Sorry, I didn't understand.");
    await convo.repeat();
  } else {
    const startDate = new Date(convo.vars.event_time_start_iso);

    switch (res) {
      case "weekly": {
        const gcalRecurrence = "RRULE:FREQ=WEEKLY;COUNT=4";
        convo.setVar("gcal_recurrence", gcalRecurrence.toString());

        const zoomRecurrence = {
          type: ZoomRecurrenceType.Weekly,
          end_times: 4,
          weekly_days: startDate.getDay() + 1,
        };
        convo.setVar("zoom_recurrence", zoomRecurrence);

        convo.setVar("recurrence_description", "Weekly, 4 times");
        break;
      }

      case "monthly": {
        // startDate is the Nth instance of a certain weekday in its month.
        // That's what we want to repeat on, not the actual day of the month.
        const weekNumber = Math.ceil(startDate.getDate() / 7);
        const repeatWeekNumber = weekNumber > 4 ? -1 : weekNumber;

        const weekday = startDate.getDay();

        const gcalRecurrence = `RRULE:FREQ=MONTHLY;COUNT=3;BYDAY=${RRULE_WEEKDAY_CODES[weekday]};BYSETPOS=${repeatWeekNumber}`;
        convo.setVar("gcal_recurrence", gcalRecurrence);

        const zoomRecurrence = {
          type: ZoomRecurrenceType.Monthly,
          end_times: 3,
          monthly_week_day: weekday + 1,
          monthly_week: repeatWeekNumber,
        };
        convo.setVar("zoom_recurrence", zoomRecurrence);

        convo.setVar("recurrence_description", "Monthly, 3 times");
        break;
      }

      default: {
        convo.setVar("gcal_recurrence", undefined);
        convo.setVar("zoom_recurrence", undefined);
        convo.setVar("recurrence_description", "None");
        break;
      }
    }
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
    password,
    convo.vars.zoom_recurrence
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
    endTimeISO,
    convo.vars.gcal_recurrence
  );
  convo.setVar("calendar_link", gcalResponse.data.htmlLink);
}
