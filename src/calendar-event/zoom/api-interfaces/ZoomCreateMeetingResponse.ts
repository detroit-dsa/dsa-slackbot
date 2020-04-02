import { ZoomMeetingType } from "./ZoomMeetingType";

export interface ZoomCreateMeetingResponse {
  topic: string;
  type: ZoomMeetingType;
  start_time: Date;
  duration: number;
  timezone: string;
  password: string;
  agenda: string;
}