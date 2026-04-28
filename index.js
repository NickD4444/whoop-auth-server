const http = require('http');
const https = require('https');
const url = require('url');

const CLIENT_ID = '37a219fd-de4d-4ed5-b329-342be8b73876';
const CLIENT_SECRET = 'f4c66251669621aa6a4d69a1acd7a10e2ff7729ae317ea0f1f7f0c570e4ebcf1';
const REDIRECT_URI = 'https://whoop-auth-server.onrender.com/callback';
const APP_SCHEME = 'healthdash://token';

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/callback') {
    const code = parsed.query.code;
    const error = parsed.query.error;
    
    if (error) {
      res.end('Whoop error: ' + error + ' - ' + parsed.query.error_description);
      return;
    }
    
    if (!code) {
      res.end('No code. Full URL: ' + req.url);
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
 } else if (parsed.pathname === '/test') {
    const token = parsed.query.token;
    const options = {
      hostname: 'api.prod.whoop.com',
      path: '/developer/v1/user/profile/basic',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token },
    };
    const testReq = https.request(options, (testRes) => {
      let data = '';
      testRes.on('data', chunk => data += chunk);
      testRes.on('end', () => res.end('Status: ' + testRes.statusCode + ' Body: ' + data));
    });
    testReq.on('error', e => res.end('Error: ' + e.message));
    testReq.end();
  } else if (parsed.pathname === '/eightsleep/login') {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const email = params.get('email');
    const password = params.get('password');

    const loginBody = JSON.stringify({
  email,
  password,
  client_id: '0894c7f33bb94800a03f1f4df13a4f38',
  client_secret: 'f0954a3e0e9b47348e98fc5f0b2d45c3b4ba1790e65973febc690037bdadceba',
  grant_type: 'password',
  device_id: 'ios_' + Math.random().toString(36).substring(2, 15),
});

    const options = {
      hostname: 'auth-api.8slp.net',
      path: '/v1/tokens',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody),
      },
    };

    const eightReq = https.request(options, (eightRes) => {
      let data = '';
      eightRes.on('data', chunk => data += chunk);
      eightRes.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
      });
    });
    eightReq.on('error', e => res.end(JSON.stringify({ error: e.message })));
    eightReq.write(loginBody);
    eightReq.end();
  });

} else if (parsed.pathname === '/eightsleep/sleep') {
  const token = parsed.query.token;
  const userId = parsed.query.userId;

  const options = {
    hostname: 'client-api.8slp.net',
    path: `/v1/users/${userId}/intervals?start=2020-01-01&end=2030-01-01&limit=1`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'accept': 'application/json',
    },
  };

  const sleepReq = https.request(options, (sleepRes) => {
    let data = '';
    sleepRes.on('data', chunk => data += chunk);
    sleepRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    });
  });
  sleepReq.on('error', e => res.end(JSON.stringify({ error: e.message })));
  sleepReq.end();
  } else {
    res.end('HealthDash Auth Server running');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
