import axios from "axios";

const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";

export class ZoomApiClient {
  constructor(zoomJwt) {
    this._zoomJwt = zoomJwt;

    this._defaultAxiosConfig = {
      headers: { Authorization: `Bearer ${this._zoomJwt}` },
    };
  }

  async getScheduledMeetings() {
    const uri = `${ZOOM_API_BASE_URL}/users/me/meetings?type=upcoming&page_size=10`;
    const response = await axios.get(uri, this._defaultAxiosConfig);

    return response.data;
  }

  async createMeeting(request) {
    const uri = `${ZOOM_API_BASE_URL}/users/me/meetings?type=scheduled`;
    const response = await axios.post(uri, request, this._defaultAxiosConfig);

    return response.data;
  }
}

export { ZoomMeetingType } from "./ZoomMeetingType";
export { ZoomMeetingApprovalType } from "./ZoomMeetingApprovalType";
export { ZoomRecurrenceType } from "./ZoomRecurrenceType";
