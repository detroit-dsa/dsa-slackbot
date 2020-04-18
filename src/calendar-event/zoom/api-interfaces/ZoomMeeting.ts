import { ZoomMeetingType } from "./ZoomMeetingType";
import { ZoomMeetingApprovalType } from "./ZoomMeetingApprovalType";

export interface ZoomMeeting {
  type: ZoomMeetingType;
  topic: string;
  agenda: string;
  start_time: string;
  duration: number;
  timezone?: string;
  password?: string;
  settings?: ZoomMeetingSettings;
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

export interface ZoomMeetingSettings {
  join_before_host: boolean;
  waiting_room: boolean;
  mute_upon_entry: boolean;
  approval_type: ZoomMeetingApprovalType;
}
