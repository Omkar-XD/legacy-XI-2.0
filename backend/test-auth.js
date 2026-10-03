const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Cookie'] = `token=${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch(e) {
          parsed = data;
        }
        
        let returnedToken = null;
        if (res.headers['set-cookie']) {
          const cookie = res.headers['set-cookie'][0];
          const match = cookie.match(/token=([^;]+)/);
          if (match) returnedToken = match[1];
        }

        resolve({ statusCode: res.statusCode, data: parsed, token: returnedToken });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  const ts = Date.now();
  const email = `testuser_${ts}@example.com`;
  const password = 'password123';
  let userToken = null;

  try {
    console.log('1. Valid registration');
    let res = await request('POST', '/api/auth/register', { email, password });
    console.assert(res.statusCode === 201, `Expected 201, got ${res.statusCode}`);
    userToken = res.token;
    console.log(' - OK');

    console.log('2. Duplicate email');
    res = await request('POST', '/api/auth/register', { email, password });
    console.assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
    console.log(' - OK');

    console.log('3. Invalid credentials (wrong password)');
    res = await request('POST', '/api/auth/login', { email, password: 'wrongpassword' });
    console.assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
    console.log(' - OK');

    console.log('4. Authenticated request');
    res = await request('GET', '/api/auth/me', null, userToken);
    console.assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    console.assert(res.data.user.email === email, `Expected ${email}, got ${res.data.user.email}`);
    console.log(' - OK');

    console.log('5. Unauthenticated request');
    res = await request('GET', '/api/auth/me');
    console.assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
    console.log(' - OK');

    console.log('6. Admin authorization (should fail for customer)');
    res = await request('GET', '/api/auth/admin-only', null, userToken);
    console.assert(res.statusCode === 403, `Expected 403, got ${res.statusCode}`);
    console.log(' - OK');

    console.log('7. Invalid token');
    res = await request('GET', '/api/auth/me', null, 'invalid_token_here');
    console.assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
    console.log(' - OK');

    console.log('ALL TESTS PASSED');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

runTests();
