const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
}

async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

function getCalendarClient() {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.calendar({
    version: 'v3',
    auth: oauth2Client,
  });
}

async function createGoogleMeetEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  attendees = [],
}) {
  const calendar = getCalendarClient();

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Gaza',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Gaza',
      },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    },
  });

  return {
    googleEventId: response.data.id,
    meetingLink: response.data.hangoutLink || '',
  };
}

module.exports = {
  getAuthUrl,
  getTokens,
  createGoogleMeetEvent,
};