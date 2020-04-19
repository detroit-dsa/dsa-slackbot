import { google, calendar_v3 } from "googleapis";
import { JWT } from "google-auth-library/build/src/auth/jwtclient";
import { GaxiosResponse } from "gaxios";

export class GoogleCalendarApiClient {
  private _calendarApi: calendar_v3.Calendar;
  private _jwtClient: JWT;
  private _jwtClientauthorized: boolean;

  constructor(
    private _calendarId: string,
    jsonCredPath: string
  ) {
    this._jwtClientauthorized = false;

    const jsonCred = require(jsonCredPath);
    this._jwtClient = new google.auth.JWT(
      jsonCred.client_email,
      undefined,
      jsonCred.private_key,
      ["https://www.googleapis.com/auth/calendar"]
    );

    this._calendarApi = google.calendar({ version: "v3", auth: this._jwtClient });
  }

  public async getEvents(
  ): Promise<calendar_v3.Schema$Event[]> {
    await this.ensureJwtClientIsAuthorized();

    const response = await this._calendarApi.events.list(
      {
        calendarId: this._calendarId,
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime"
      }
    );

    if (response.data && response.data.items && response.data.items.length > 0) {
      return response.data.items;
    }

    return [];
  }

  public async addEvent(
    request: calendar_v3.Schema$Event
  ): Promise<GaxiosResponse<calendar_v3.Schema$Event>> {
    await this.ensureJwtClientIsAuthorized();

    const response = await this._calendarApi.events.insert(
      {
        calendarId: this._calendarId,
        requestBody: request
      });

    return response;
  }

  // Can't run an async method from the constructor, so this has to be called
  // from some other async context before using the JWT client.
  private async ensureJwtClientIsAuthorized(
  ): Promise<JWT> {
    if (!this._jwtClientauthorized) {
      await this._jwtClient.authorize();
      this._jwtClientauthorized = true;
    }

    return this._jwtClient;
  }
}
