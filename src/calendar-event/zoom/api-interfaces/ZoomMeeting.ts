import { ZoomMeetingType } from "./ZoomMeetingType";
export interface ZoomMeeting {
  topic: string;
  type: ZoomMeetingType;
  start_time: Date;
  duration: number;
  timezone: string;
  agenda: string;
}
