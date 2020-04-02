import { ZoomApiCollectionResponse } from "./ZoomApiResponse";
import { ZoomScheduledMeeting } from "./ZoomScheduledMeeting";

export interface ZoomListMeetingsResponse extends ZoomApiCollectionResponse {
  meetings: ZoomScheduledMeeting[];
}
