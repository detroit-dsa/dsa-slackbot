import { ZoomMeetingType } from "./ZoomMeetingType";

export interface ZoomMeeting {
  type: ZoomMeetingType;
  topic: string;
  agenda: string;
  start_time: string;
  duration: number;
  timezone?: string;
  password?: string;
}

export interface ZoomScheduledMeeting extends ZoomMeeting {
  id: number;
  host_id: string;
  created_at: string;
  status: "waiting" | "started" | "finished";
  start_url: string;
  join_url: string;
}

export interface ZoomCreateMeetingRequest extends ZoomMeeting { }
export interface ZoomCreateMeetingResponse extends ZoomScheduledMeeting { }

export interface ZoomGetMeetingResponse extends ZoomScheduledMeeting {
  uuid: string;
}
