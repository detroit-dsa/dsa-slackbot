import { ZoomMeetingType } from "./ZoomMeetingType";
export interface ZoomMeeting {
  topic: string;
  type: ZoomMeetingType;
  start_time: string;
  duration: number;
  timezone: string;
  agenda: string;
}
