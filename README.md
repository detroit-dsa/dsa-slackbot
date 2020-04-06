# Detroit DSA Slack bot

## Usage

* Generate a JWT for your Zoom account and set the `ZOOM_JWT` environment variable (or set it in a `.env` file at the root of the repo).
* Generate a service account that can access Google Calendar. Generate credentials for it and save them to `src/google-privatekey.json`.

### Run a local web server for testing

```bash
npm run start:dev
```
