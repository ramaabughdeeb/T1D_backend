const express = require('express');
const router = express.Router();

const {
  getAuthUrl,
  getTokens,
} = require('../services/googleCalendarService');

router.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    const tokens = await getTokens(code);

    res.send(`
      <h2>Google connected successfully</h2>
      <p>Copy this refresh token and put it inside your .env file:</p>
      <textarea style="width:700px;height:180px;">${tokens.refresh_token || ''}</textarea>
    `);
  } catch (error) {
    res.status(500).json({
      message: 'Google auth failed',
      error: error.message,
    });
  }
});

module.exports = router;