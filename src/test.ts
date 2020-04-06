import { ZoomApiClient } from "./calendar-event/zoom";
import { GoogleCalendarApiClient } from "./calendar-event/google-calendar";

require('dotenv').config();

(async () => {
  // const zoomClient = new ZoomApiClient(process.env.ZOOM_JWT);
  // console.log(await zoomClient.listScheduledMeetings());

  // const googleCalendarClient = new GoogleCalendarApiClient();
  // console.log(await googleCalendarClient.listEvents());
})();