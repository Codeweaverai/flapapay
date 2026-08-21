const dotenv = require('/var/www/flapapay/node_modules/dotenv');
dotenv.config({ path: '/var/www/flapapay/.env' });
const jwt = require('/var/www/flapapay/node_modules/jsonwebtoken');
const { Client } = require('/var/www/flapapay/node_modules/pg');
const http = require('http');

async function request(path, token, method = 'GET', body, environmentId = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({ hostname: '127.0.0.1', port: 3005, path, method, headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(environmentId ? { 'x-flapapay-environment-id': environmentId } : {}),
    }}, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const client = new Client({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME || 'flapapay_db', user: process.env.DB_USER || 'flapapay', password: process.env.DB_PASSWORD });
  await client.connect();
  const user = (await client.query('SELECT u.id FROM users u JOIN merchants m ON m.user_id = u.id ORDER BY u.id LIMIT 1')).rows[0];
  const environments = (await client.query(`SELECT me.id, me.kind FROM merchant_environments me JOIN merchants m ON m.id = me.merchant_id WHERE m.user_id = $1 ORDER BY CASE WHEN me.kind = 'live' THEN 0 ELSE 1 END`, [user.id])).rows;
  await client.end();
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const listed = await request('/merchant/environments', token);
  if (listed.status !== 200) throw new Error(`environment list returned ${listed.status}`);
  const sandbox = environments.find(environment => environment.kind === 'sandbox');
  const live = environments.find(environment => environment.kind === 'live');
  if (!sandbox || !live) throw new Error('expected live and sandbox environments');
  const selectedSandbox = await request(`/merchant/environments/${sandbox.id}/select`, token, 'POST');
  if (selectedSandbox.status !== 200) throw new Error(`sandbox selection returned ${selectedSandbox.status}: ${JSON.stringify(selectedSandbox.data)}`);
  const activity = await request('/merchant/environment-activity', token, 'GET', undefined, sandbox.id);
  if (activity.status !== 200 || activity.data.environmentId !== sandbox.id) throw new Error('sandbox activity was not scoped to selected environment');
  const sandboxKeys = await request('/merchants/keys', token, 'GET', undefined, sandbox.id);
  if (sandboxKeys.status !== 200 || sandboxKeys.data?.environment?.id !== sandbox.id || sandboxKeys.data?.environment?.kind !== 'sandbox') {
    throw new Error('sandbox API keys were not scoped to selected environment');
  }
  const sandboxWallets = await request('/auth/me', token, 'GET', undefined, sandbox.id);
  if (sandboxWallets.status !== 200 || sandboxWallets.data?.environment?.id !== sandbox.id || sandboxWallets.data?.environment?.kind !== 'sandbox') {
    throw new Error('sandbox dashboard wallets were not scoped to selected environment');
  }
  const sandboxWalletList = await request('/wallets?mode=test', token);
  if (sandboxWalletList.status !== 200 || !Array.isArray(sandboxWalletList.data)) throw new Error('sandbox wallet list request failed');
  const liveActivity = await request('/merchant/environment-activity', token, 'GET', undefined, live.id);
  if (liveActivity.status !== 200 || liveActivity.data.environmentId !== live.id) throw new Error('live activity was not scoped to selected environment');
  const liveKeys = await request('/merchants/keys', token, 'GET', undefined, live.id);
  if (liveKeys.status !== 200 || liveKeys.data?.environment?.id !== live.id || liveKeys.data?.environment?.kind !== 'live') {
    throw new Error('live API keys were not scoped to selected environment');
  }
  const liveWallets = await request('/auth/me', token, 'GET', undefined, live.id);
  if (liveWallets.status !== 200 || liveWallets.data?.environment?.id !== live.id || liveWallets.data?.environment?.kind !== 'live') {
    throw new Error('live dashboard wallets were not scoped to selected environment');
  }
  const liveWalletList = await request('/wallets?mode=live', token);
  if (liveWalletList.status !== 200 || !Array.isArray(liveWalletList.data)) throw new Error('live wallet list request failed');
  const selectedLive = await request(`/merchant/environments/${live.id}/select`, token, 'POST');
  const liveEnvironment = listed.data.environments.find(environment => environment.kind === 'live');
  const shouldBlockLive = liveEnvironment.complianceStatus !== 'ACTIVE' || liveEnvironment.isLiveEnabled !== true;
  if (shouldBlockLive && selectedLive.status !== 409) throw new Error(`expected Live compliance gate 409, got ${selectedLive.status}`);
  console.log(JSON.stringify({ listStatus: listed.status, sandboxSelectionStatus: selectedSandbox.status, sandboxActivityStatus: activity.status, sandboxKeysStatus: sandboxKeys.status, sandboxWalletCount: sandboxWallets.data.wallets.length, sandboxWalletListCount: sandboxWalletList.data.length, liveActivityStatus: liveActivity.status, liveKeysStatus: liveKeys.status, liveWalletCount: liveWallets.data.wallets.length, liveWalletListCount: liveWalletList.data.length, liveSelectionStatus: selectedLive.status, liveBlockedByCompliance: shouldBlockLive }));
})().catch(error => { console.error(error.message); process.exit(1); });
