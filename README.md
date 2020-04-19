# Detroit DSA Slack bot

## Usage

* Generate a JWT for your Zoom account and set the `ZOOM_JWT` environment variable (or set it in a `.env` file at the root of the repo).
* Generate a service account that can access Google Calendar. Generate credentials for it and save them to `src/google-privatekey.json`.
  * https://flaviocopes.com/google-api-authentication/
    * Follow the "Service to Service API" directions
  * https://medium.com/@ArchTaqi/google-calendar-api-in-your-application-without-oauth-consent-screen-4fcc1f8eb380
  * Enable the Calendar API: https://console.developers.google.com/apis/library/calendar-json.googleapis.com
  * Create a service account: https://console.developers.google.com/apis/credentials
    * No special roles/permissions required
    * Generate credentials as JSON
    * Go to the calendar and add the service account to the list of editors

### Run a local web server for testing

```bash
npm run start:dev
```
