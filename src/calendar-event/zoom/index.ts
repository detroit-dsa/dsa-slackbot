import axios from "axios";
import { ZoomListMeetingsResponse } from "./api-interfaces/ZoomApiCollections";
import { ZoomCreateMeetingRequest, ZoomCreateMeetingResponse } from "./api-interfaces/ZoomMeeting";

const ZOOM_API_BASE_URL: string = "https://api.zoom.us/v2";

export class ZoomApiClient {
  constructor(
    private _zoomJwt = process.env.ZOOM_JWT!
  ) { }

  private _defaultAxiosConfig = {
    headers: { Authorization: `Bearer ${this._zoomJwt}` },
  };

  public async getScheduledMeetings(
  ): Promise<ZoomListMeetingsResponse> {
    const uri = `${ZOOM_API_BASE_URL}/users/me/meetings?type=upcoming&page_size=10`;
    const response = await axios.get(uri, this._defaultAxiosConfig);

    return <ZoomListMeetingsResponse>response.data;
  }

  public async createMeeting(
    request: ZoomCreateMeetingRequest
  ): Promise<ZoomCreateMeetingResponse> {
    const uri = `${ZOOM_API_BASE_URL}/users/me/meetings?type=scheduled`;
    const response = await axios.post(uri, request, this._defaultAxiosConfig);

    return <ZoomCreateMeetingResponse>response.data;
  }
}
