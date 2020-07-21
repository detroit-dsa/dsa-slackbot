import { google } from "googleapis";

export class GoogleCalendarApiClient {
  constructor(calendarId, jsonCredPath) {
    this._jwtClientauthorized = false;
    this._calendarId = calendarId;

    const jsonCred = require(jsonCredPath);
    this._jwtClient = new google.auth.JWT(
      jsonCred.client_email,
      undefined,
      jsonCred.private_key,
      ["https://www.googleapis.com/auth/calendar"]
    );

    this._calendarApi = google.calendar({
      version: "v3",
      auth: this._jwtClient,
    });
  }

  async getEvents() {
    await this._ensureJwtClientIsAuthorized();

    const response = await this._calendarApi.events.list({
      calendarId: this._calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    if (
      response.data &&
      response.data.items &&
      response.data.items.length > 0
    ) {
      return response.data.items;
    }

    return [];
  }

  async addEvent(request) {
    await this._ensureJwtClientIsAuthorized();

    const response = await this._calendarApi.events.insert({
      calendarId: this._calendarId,
      requestBody: request,
    });

    return response;
  }

  // Can't run an async method from the constructor, so this has to be called
  // from some other async context before using the JWT client.
  async _ensureJwtClientIsAuthorized() {
    if (!this._jwtClientauthorized) {
      await this._jwtClient.authorize();
      this._jwtClientauthorized = true;
    }

    return this._jwtClient;
  }
}
