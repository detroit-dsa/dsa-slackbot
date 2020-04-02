import { google, calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library/build/src/auth/jwtclient'
import privatekey from '../../google-privatekey.json';

export class GoogleCalendarApiClient {
  constructor() {
    this._jwtClient = new google.auth.JWT(
      privatekey.client_email,
      undefined,
      privatekey.private_key,
      ['https://www.googleapis.com/auth/calendar'])

    this._calendarApi = google.calendar({ version: 'v3', auth: this._jwtClient })
  }

  private _calendarApi: calendar_v3.Calendar;
  private _jwtClient: JWT;

  public async listEvents() {
    // TODO: Authorize should only happen once
    await this._jwtClient.authorize();
    const calendar = google.calendar({ version: 'v3', auth: this._jwtClient });

    const response = await calendar.events.list(
      {
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      }
    );

    console.log(response);
  }
}
