import { ZoomApiClient } from "./calendar-event/zoom";

require('dotenv').config();

(async () => {
  const zoomClient = new ZoomApiClient(process.env.ZOOM_JWT);
  console.log(await zoomClient.listScheduledMeetings());
})();