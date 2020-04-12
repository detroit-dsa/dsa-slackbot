import { ZoomGetMeetingResponse } from "./ZoomMeeting";

export interface ZoomApiCollectionResponse {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
}

export interface ZoomListMeetingsResponse extends ZoomApiCollectionResponse {
  meetings: ZoomGetMeetingResponse[];
}
