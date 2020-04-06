import { google, calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library/build/src/auth/jwtclient'
import privatekey from '../../google-privatekey.json';

export class GoogleCalendarApiClient {
  constructor() {
    this._jwtClientauthorized = false;
    this._jwtClient = new google.auth.JWT(
      privatekey.client_email,
      undefined,
      privatekey.private_key,
      ['https://www.googleapis.com/auth/calendar']);

    this._calendarApi = google.calendar({ version: 'v3', auth: this._jwtClient })
  }

  private _calendarApi: calendar_v3.Calendar;
  private _jwtClient: JWT;
  private _jwtClientauthorized: boolean;

  public async getEvents(
  ): Promise<calendar_v3.Schema$Event[]> {
    await this.ensureJwtClientIsAuthorized();

    const response = await this._calendarApi.events.list(
      {
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      }
    );

    if (response.data && response.data.items && response.data.items.length > 0) {
      return response.data.items;
    }

    return [];
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
