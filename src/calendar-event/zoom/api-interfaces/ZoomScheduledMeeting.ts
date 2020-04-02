import { ZoomMeeting } from "./ZoomMeeting";

export interface ZoomScheduledMeeting extends ZoomMeeting {
  uuid: string;
  id: string;
  host_id: string;
  created_at: Date;
  join_url: string;
}
