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
  convo,
  startTimeISO,
  durationMinutes,
  password
) {
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

  console.log("Creating Zoom meeting:", createZoomMeetingRequest);

  let zoomResponse;
  try {
    zoomResponse = await zoomClient.createMeeting(createZoomMeetingRequest);
    convo.setVar("host_url", zoomResponse.start_url);
    convo.setVar("join_url", zoomResponse.join_url);
    convo.setVar("password", password);
  } catch (error) {
    console.error("Failed to add to Zoom.", error);
  }

  return zoomResponse;
}

export async function createGcalEvent(
  convo,
  startTimeISO,
  endTimeISO,
  joinUrl
) {
  const gcalDescription = `${convo.vars.description}

Join Zoom meeting: ${convo.vars.join_url}
Password: ${convo.vars.password}`;

  const createGcalMeetingRequest = {
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
    location: joinUrl,
  };

  console.log("Creating GCal meeting:", createGcalMeetingRequest);

  try {
    const gcalResponse = await googleCalendarClient.addEvent(
      createGcalMeetingRequest
    );
    convo.setVar("calendar_link", gcalResponse.data.htmlLink);
  } catch (error) {
    console.error("Failed to add to Google Calendar.", error);
  }
}
