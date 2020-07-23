# Detroit DSA Slack bot

## Development
You must first set up the required API configurations for Slack, Zoom, and Google Calendar.

Set environment variables in a file named `.env` at the root of the repo. Copy `.env.example` to get started. Required environment variables are specified below with a ✳.

### Zoom API setup
* Create a personal Zoom account to use for testing.
* Go to <https://marketplace.zoom.us/develop/create> and create an app.
* Click the app and go to the **App Credentials** page.
* ✳ Generate a JWT for your Zoom account (hidden under the **View JWT token** section at the bottom of the page). Set the `ZOOM_JWT` environment variable to this value.

### Google Calendar API setup
* Open Google Calendar, go to the settings, and create a new calendar to use for testing.
* ✳ In the **Integrate Calendar** section of your calendar's settings, find the **Calendar ID**. Set the `GOOGLE_CALENDAR_ID` environment variable to this value.
* Generate a service account that can access Google Calendar. Generate credentials for it and save them to your computer.
  * Start here: <https://console.developers.google.com/>
  * This part takes some effort. Here are some guides to get Google Calendar set up the way we need it:
    * [How to authenticate to any Google API](https://flaviocopes.com/google-api-authentication/#service-to-service-api)
      * Follow the "Service to Service API" directions
    * [Google Calendar API in Your Application without OAuth Consent Screen](https://medium.com/@ArchTaqi/google-calendar-api-in-your-application-without-oauth-consent-screen-4fcc1f8eb380)
  * Enable the Calendar API: <https://console.developers.google.com/apis/library/calendar-json.googleapis.com>
  * Create a service account: <https://console.developers.google.com/apis/credentials>
    * No special roles/permissions required
    * After the account is created, click on it and find the **Keys** section. Add a key and choose **JSON**.
* ✳ Find the `"client_email"` value in the `.json` file you downloaded. Set the `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL` environment variable to this value.
* ✳ Find the `"private_key"` value in the `.json` file you downloaded. Set the `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` environment variable to this value.
* Go to the sharing settings of the calendar you created and add the service account to the list of editors.
  * The service account you created has an email address associated with it - it should be something like `myserviceaccount@myapp-123.iam.gserviceaccount.com`.
  * In the calendar's sharing settings, add this email address under **Share with specific people** and make sure it's set to **Make changes to events**.

### Slack API setup

* Create a new Slack organization to use for development.
* Go to <https://api.slack.com/apps> and register an app in your development workspace.
* To make the Slack instance talk to your local app, you need a public URL that Slack can talk to. Use [ngrok](https://ngrok.com/) to set this up.
  * By default the bot listens on port `3000`, so run `ngrok http 3000`.
* Go to the **Features > Event Subscriptions** page in your Slack app configuration and set the **Request URL** to <http://YOURAPP.ngrok.io/api/messages>
* On the **Event Subscriptions** page, open the **Subscribe to bot events** section and subscribe to the `app_mention` and `message.im` events.
* On the **OAuth & Permissions** page, find **Bot Token Scopes**. Add OAuth scopes for:
  * `app_mentions:read`
  * `channels:read`
  * `chat:write`
  * `im:history`
  * `im:read`
  * `im:write`
  * `mpim:write`
* On the **OAuth & Permissions** page, install the bot to your workspace.
* ✳ On the **OAuth & Permissions** page, find the **bot token**. Set the `SLACK_BOT_TOKEN` environment variable to this value.
* ✳ Go to the **Basic Information** page in your Slack app configuration and find the **Signing Secret**. Set the `SLACK_CLIENT_SIGNING_SECRET` environment variable to this value.

### Local environment setup
Run `npm install` to download dependencies and set up TypeScript.

Copy `.env.example` to a file named `.env` and make sure any required variables mentioned above are set.

The main entrypoint for the bot is `bot.ts`. The "Launch Program" task in VS Code is set up to initialize with this file.

The chat flow for adding a calendar event is under `src/features/calendar_event.ts`, and the clients this chat flow uses to talk to Google Calendar and Zoom are under `src/calendar-event`.

Run the `start:dev` npm task to start the bot.

```bash
npm run start:dev
```

### Resources
* [Botkit docs](https://botkit.ai/docs/v4/)
* [Botkit conversation docs](https://botkit.ai/docs/v4/conversations.html)
* [Botkit Slack adapter](https://botkit.ai/docs/v4/platforms/slack.html)
* [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client#readme)
* [Zoom API docs](https://marketplace.zoom.us/docs/api-reference/zoom-api) (no Node.js client library for exists for Zoom)
