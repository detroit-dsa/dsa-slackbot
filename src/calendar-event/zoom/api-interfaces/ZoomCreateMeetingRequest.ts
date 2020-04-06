import { ZoomMeetingType } from "./ZoomMeetingType";

export interface ZoomCreateMeetingRequest {
  topic: string;
  type: ZoomMeetingType;
  start_time: Date;
  duration: number;
  timezone: string;
  password?: string;
  agenda: string;
}
