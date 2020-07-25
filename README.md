# Detroit DSA Slack bot

## Development
You must first set up the required API configurations for Slack, Zoom, and Google Calendar.

Set environment variables in a file named `.env` at the root of the repo. Copy `.env.example` to get started. Required environment variables are specified below with a ✳.

### Zoom API setup
* Create a personal Zoom account to use for testing.
* Go to <https://marketplace.zoom.us/develop/create> and create an app.
* Click the app and go to the **App Credentials** page.
* ✳ Generate a JWT for your Zoom account (hidden under the **View JWT token** section at the bottom of the page). Set the `ZOOM_JWT` environment variable to this value.

### Google API setup
* Generate a service account that can access Google Calendar. Generate credentials for it and save them to your computer.
  * Enable the Calendar API: <https://console.developers.google.com/apis/library/calendar-json.googleapis.com>
  * Create a service account: <https://console.developers.google.com/apis/credentials>
    * Continue past the optional prompts for special roles and permissions
    * After the account is created, click on it and find the **Keys** section. Add a key and choose **JSON**.
* ✳ Find the `"client_email"` value in the `.json` file you downloaded. Set the `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL` environment variable to this value.
* ✳ Find the `"private_key"` value in the `.json` file you downloaded. Set the `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` environment variable to this value.

### Google Calendar setup
* Open Google Calendar, go to the settings, and create a new calendar to use for testing.
* ✳ In the **Integrate Calendar** section of your calendar's settings, find the **Calendar ID**. Set the `GOOGLE_CALENDAR_ID` environment variable to this value.
* The service account you created has an email address associated with it - it should be something like `myserviceaccount@myapp-123.iam.gserviceaccount.com`.
* In the calendar's sharing settings, add this email address under **Share with specific people** and make sure it's set to **Make changes to events**.

### Slack API setup
* To make the Slack instance talk to your app during local development, you need a public URL that Slack can talk to. Use [ngrok](https://ngrok.com/) to set this up.
  * By default the bot listens on port `3000`, so run `ngrok http 3000`.
* Create a personal Slack organization to use for development.
* Go to <https://api.slack.com/apps> and register an app in your development workspace.
* Go to the **Features > Event Subscriptions** page in your Slack app configuration.
  * Set the **Request URL** to <http://YOURAPP.ngrok.io/api/messages>
  * Open the **Subscribe to bot events** section and subscribe to the following events:
    * `app_mention`
    * `message.im`
* Go to the **Features > OAuth & Permissions** page in your Slack app configuration.
  * Find **Bot Token Scopes**. Add OAuth scopes for:
    * `app_mentions:read`
    * `channels:read`
    * `chat:write`
    * `im:history`
    * `im:read`
    * `im:write`
    * `mpim:write`
  * Install the bot to your workspace.
  * ✳ Find the **Bot User OAuth Access Token**. Set the `SLACK_BOT_TOKEN` environment variable to this value.
* Go to the **Basic Information** page in your Slack app configuration.
  * ✳ Find the **Signing Secret**. Set the `SLACK_CLIENT_SIGNING_SECRET` environment variable to this value.

### Local environment setup
* Run `npm install` to download dependencies.
* Copy `.env.example` to a file named `.env` and make sure any required variables mentioned above are set.

The main entry point is `bot.js`. Run `npm run start:dev` to start the bot in development mode with automatic reloading on code changes.

Run `npm run build` followed by `npm run start` to start in production mode.

Any file under the `features/` directory will be auto-loaded by the bot controller. Refer to the Botkit docs (linked below) for more detail on how to add additional bot features.

### Resources
* [Botkit docs](https://botkit.ai/docs/v4/)
* [Botkit conversation docs](https://botkit.ai/docs/v4/conversations.html)
* [Botkit Slack adapter](https://botkit.ai/docs/v4/platforms/slack.html)
* [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client#readme)
* [Zoom API docs](https://marketplace.zoom.us/docs/api-reference/zoom-api) (no Node.js client library exists for Zoom)
* Some guides to get Google Calendar set up the way we need it:
  * [How to authenticate to any Google API](https://flaviocopes.com/google-api-authentication/#service-to-service-api)
    * Follow the "Service to Service API" directions
  * [Google Calendar API in Your Application without OAuth Consent Screen](https://medium.com/@ArchTaqi/google-calendar-api-in-your-application-without-oauth-consent-screen-4fcc1f8eb380)
