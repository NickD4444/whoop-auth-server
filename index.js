const http = require('http');
const https = require('https');
const url = require('url');

const CLIENT_ID = '37a219fd-de4d-4ed5-b329-342be8b73876';
const CLIENT_SECRET = 'f4c66251669621aa6a4d69a1acd7a10e2ff7729ae317ea0f1f7f0c570e4ebcf1';
const REDIRECT_URI = 'https://whoop-auth-server.onrender.com/callback';
const APP_SCHEME = 'whoop://healthdash/token';

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/callback') {
    const code = parsed.query.code;
    if (!code) {
      res.end('No code');
      return;
    }

    const body = [
      'grant_type=authorization_code',
      '&code=' + code,
      '&client_id=' + CLIENT_ID,
      '&client_secret=' + CLIENT_SECRET,
      '&redirect_uri=' + encodeURIComponent(REDIRECT_URI),
    ].join('');

    const options = {
      hostname: 'api.prod.whoop.com',
      path: '/oauth/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const whoopReq = https.request(options, (whoopRes) => {
      let data = '';
      whoopRes.on('data', chunk => data += chunk);
      whoopRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          const token = json.access_token;
          if (token) {
            res.writeHead(302, { Location: APP_SCHEME + '?token=' + token });
            res.end();
          } else {
            res.end('No token: ' + data);
          }
        } catch (e) {
          res.end('Parse error: ' + e.message);
        }
      });
    });

    whoopReq.on('error', e => res.end('Error: ' + e.message));
    whoopReq.write(body);
    whoopReq.end();
  } else {
    res.end('HealthDash Auth Server running');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
