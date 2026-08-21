const dotenv = require('/var/www/flapapay/node_modules/dotenv');
dotenv.config({ path: '/var/www/flapapay/.env' });
const jwt = require('/var/www/flapapay/node_modules/jsonwebtoken');
const { Client } = require('/var/www/flapapay/node_modules/pg');
const http = require('http');

function request(path, token, method = 'GET', environmentId = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3005,
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(environmentId ? { 'x-flapapay-environment-id': environmentId } : {}),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let data = null;
        try { data = body ? JSON.parse(body) : null; } catch { data = { raw: body }; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'flapapay',
    password: process.env.DB_PASSWORD,
  });
  await client.connect();
  const merchantResult = await client.query(
    `SELECT m.id AS merchant_id, m.user_id
       FROM merchants m
      WHERE m.compliance_status <> 'ACTIVE' OR m.is_live_enabled IS DISTINCT FROM TRUE
      ORDER BY m.created_at DESC NULLS LAST
      LIMIT 1`,
  );
  if (!merchantResult.rows[0]) throw new Error('No unapproved merchant is available for compliance-gate verification');
  const merchant = merchantResult.rows[0];
  const environmentsResult = await client.query(
    `SELECT id, kind FROM merchant_environments WHERE merchant_id = $1 AND status = 'active'`,
    [merchant.merchant_id],
  );
  await client.end();
  const sandbox = environmentsResult.rows.find((environment) => environment.kind === 'sandbox');
  const live = environmentsResult.rows.find((environment) => environment.kind === 'live');
  if (!sandbox || !live) throw new Error('The unapproved merchant is missing a Sandbox or Live environment');

  const token = jwt.sign({ userId: merchant.user_id }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const list = await request('/merchant/environments', token);
  const listedSandbox = list.data?.environments?.find((environment) => environment.id === sandbox.id);
  const listedLive = list.data?.environments?.find((environment) => environment.id === live.id);
  const selectSandbox = await request(`/merchant/environments/${sandbox.id}/select`, token, 'POST');
  const selectLive = await request(`/merchant/environments/${live.id}/select`, token, 'POST');
  const sandboxKeys = await request('/merchants/keys', token, 'GET', sandbox.id);
  const directLiveKeys = await request('/merchants/keys', token, 'GET', live.id);
  const directLiveProfile = await request('/auth/me', token, 'GET', live.id);

  if (list.status !== 200 || listedSandbox?.isSelectable !== true || listedLive?.isSelectable !== false) {
    throw new Error('environment list did not expose Sandbox as selectable and Live as restricted');
  }
  if (selectSandbox.status !== 200 || selectLive.status !== 409 || selectLive.data?.code !== 'LIVE_COMPLIANCE_REQUIRED') {
    throw new Error('environment selection did not enforce the Live compliance gate');
  }
  if (sandboxKeys.status !== 200 || (sandboxKeys.data?.keys || []).some((key) => !String(key.key_type).startsWith('test_'))) {
    throw new Error('Sandbox API keys were not isolated to test credentials');
  }
  if (directLiveKeys.status !== 409 || directLiveKeys.data?.code !== 'LIVE_COMPLIANCE_REQUIRED' || directLiveProfile.status !== 409 || directLiveProfile.data?.code !== 'LIVE_COMPLIANCE_REQUIRED') {
    throw new Error('an unapproved merchant could still access a Live environment directly');
  }

  console.log(JSON.stringify({
    environmentListStatus: list.status,
    sandboxSelectable: listedSandbox?.isSelectable,
    liveSelectable: listedLive?.isSelectable,
    selectSandboxStatus: selectSandbox.status,
    selectLiveStatus: selectLive.status,
    selectLiveCode: selectLive.data?.code || null,
    sandboxKeyStatus: sandboxKeys.status,
    sandboxKeyTypes: (sandboxKeys.data?.keys || []).map((key) => key.key_type),
    directLiveKeysStatus: directLiveKeys.status,
    directLiveKeyTypes: (directLiveKeys.data?.keys || []).map((key) => key.key_type),
    directLiveProfileStatus: directLiveProfile.status,
    directLiveProfileEnvironment: directLiveProfile.data?.environment?.kind || null,
  }));
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
