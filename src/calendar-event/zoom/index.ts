import axios from 'axios';
import { ZoomListMeetingsResponse } from './api-interfaces/ZoomListMeetingsResponse';

const ZOOM_API_BASE_URL: string = "https://api.zoom.us/v2";

export class ZoomApiClient {
  constructor(
    private _zoomJwt = process.env.ZOOM_JWT!
  ) { }

  private _defaultAxiosConfig = {
    headers: { Authorization: `Bearer ${this._zoomJwt}` },
  };

  public async listScheduledMeetings(
  ): Promise<ZoomListMeetingsResponse> {
    const uri = `${ZOOM_API_BASE_URL}/users/me/meetings?type=scheduled`;
    const response = await axios.get(uri, this._defaultAxiosConfig);

    return <ZoomListMeetingsResponse>response.data;
  }
}

// export async function createMeeting(
//   request: ZoomCreateMeetingRequest
// ): Promise<ZoomCreateMeetingResponse> {
//   const uri = `${ZOOM_API_BASE_URL}/users/me/meetings?type=scheduled`;
//   const response = await axios.post(uri, request);

//   return <ZoomCreateMeetingResponse>response.data;
// }
