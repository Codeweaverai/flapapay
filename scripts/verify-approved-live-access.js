const dotenv = require('/var/www/flapapay/node_modules/dotenv');
dotenv.config({ path: '/var/www/flapapay/.env' });
const jwt = require('/var/www/flapapay/node_modules/jsonwebtoken');
const { Client } = require('/var/www/flapapay/node_modules/pg');
const http = require('http');

function request(path, token, method = 'GET', environmentId = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 3005, path, method, headers: { Authorization: `Bearer ${token}`, ...(environmentId ? { 'x-flapapay-environment-id': environmentId } : {}) } }, (res) => {
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
  const client = new Client({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME || 'flapapay_db', user: process.env.DB_USER || 'flapapay', password: process.env.DB_PASSWORD });
  await client.connect();
  const merchantResult = await client.query(`SELECT id AS merchant_id, user_id FROM merchants WHERE compliance_status = 'ACTIVE' AND is_live_enabled = TRUE ORDER BY created_at DESC NULLS LAST LIMIT 1`);
  if (!merchantResult.rows[0]) throw new Error('No approved merchant is available for Live verification');
  const merchant = merchantResult.rows[0];
  const environmentsResult = await client.query(`SELECT id, kind FROM merchant_environments WHERE merchant_id = $1 AND status = 'active'`, [merchant.merchant_id]);
  await client.end();
  const live = environmentsResult.rows.find((environment) => environment.kind === 'live');
  if (!live) throw new Error('Approved merchant is missing a Live environment');

  const token = jwt.sign({ userId: merchant.user_id }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const list = await request('/merchant/environments', token);
  const listedLive = list.data?.environments?.find((environment) => environment.id === live.id);
  const selectLive = await request(`/merchant/environments/${live.id}/select`, token, 'POST');
  const keys = await request('/merchants/keys', token, 'GET', live.id);
  const profile = await request('/auth/me', token, 'GET', live.id);
  const transactions = await request('/transactions?allHistory=true&limit=20', token, 'GET', live.id);
  if (list.status !== 200 || listedLive?.isSelectable !== true || selectLive.status !== 200) throw new Error('approved merchant could not select Live');
  if (keys.status !== 200 || keys.data?.environment?.id !== live.id || keys.data?.environment?.kind !== 'live') throw new Error('approved merchant Live keys were not available in the selected environment');
  if (profile.status !== 200 || profile.data?.environment?.id !== live.id || profile.data?.environment?.kind !== 'live') throw new Error('approved merchant Live wallet profile was not available');
  if (transactions.status !== 200 || !Array.isArray(transactions.data)) throw new Error('approved merchant Live transactions were not available');
  console.log(JSON.stringify({ environmentListStatus: list.status, liveSelectable: listedLive.isSelectable, selectLiveStatus: selectLive.status, liveKeysStatus: keys.status, liveKeyTypes: (keys.data?.keys || []).map((key) => key.key_type), liveProfileStatus: profile.status, liveWalletCount: profile.data?.wallets?.length || 0, liveTransactionsStatus: transactions.status, liveTransactionCount: transactions.data.length }));
})().catch((error) => { console.error(error.message); process.exit(1); });
