import {
  ZoomApiClient,
  ZoomMeetingType,
  ZoomMeetingApprovalType,
} from "./zoom";
import { GoogleCalendarApiClient } from "./google-calendar";

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

const TIME_ZONE = "America/New_York";

const zoomClient = new ZoomApiClient(process.env.ZOOM_JWT);

const googleCalendarClient = new GoogleCalendarApiClient(
  process.env.GOOGLE_CALENDAR_ID,
  process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
);

export async function createZoomMeeting(
  topic,
  description,
  startTimeISO,
  durationMinutes,
  password,
  recurrence
) {
  const createZoomMeetingRequest = {
    topic: topic,
    agenda: description,
    start_time: startTimeISO,
    duration: durationMinutes,
    timezone: TIME_ZONE,
    type: recurrence
      ? ZoomMeetingType.RecurringFixedTime
      : ZoomMeetingType.Scheduled,
    password: password,
    settings: {
      approval_type: ZoomMeetingApprovalType.NoRegistrationRequired,
      join_before_host: true,
      waiting_room: false,
      mute_upon_entry: true,
    },
    recurrence: recurrence,
  };

  console.log("Creating Zoom meeting:", createZoomMeetingRequest);

  let zoomResponse;
  try {
    zoomResponse = await zoomClient.createMeeting(createZoomMeetingRequest);
  } catch (error) {
    console.error("Failed to add to Zoom.", error);
  }

  return zoomResponse;
}

export async function createGcalEvent(
  title,
  description,
  password,
  joinUrl,
  startTimeISO,
  endTimeISO,
  recurrence
) {
  const createGcalMeetingRequest = {
    summary: title,
    description: `${description}\n\nJoin Zoom meeting: ${joinUrl}\nPassword: ${password}`,
    start: {
      dateTime: startTimeISO,
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: endTimeISO,
      timeZone: TIME_ZONE,
    },
    location: joinUrl,
    recurrence: [recurrence],
  };

  console.log("Creating GCal meeting:", createGcalMeetingRequest);

  let gcalResponse;
  try {
    gcalResponse = await googleCalendarClient.addEvent(
      createGcalMeetingRequest
    );
  } catch (error) {
    console.error("Failed to add to Google Calendar.", error);
  }

  return gcalResponse;
}
