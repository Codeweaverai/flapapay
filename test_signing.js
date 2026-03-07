require('dotenv').config();
const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

const baseURL = process.env.MASTERCARD_API_BASE_URL || 'https://sandbox.api.mastercard.com';
const consumerKey = process.env.MASTERCARD_CONSUMER_KEY;
const keyFilePath = process.env.MASTERCARD_KEY_FILE_PATH;
const keyPassword = process.env.MASTERCARD_KEY_PASSWORD;

console.log('--- Mastercard Signing Diagnostic ---');
console.log('Base URL:', baseURL);
console.log('Consumer Key:', consumerKey);
console.log('Key File Path:', keyFilePath);

if (!fs.existsSync(keyFilePath)) {
    console.error('ERROR: Key file NOT found at path:', keyFilePath);
    process.exit(1);
}

try {
    console.log('Reading P12 file...');
    const p12Content = fs.readFileSync(keyFilePath, 'binary');
    const p12Asn1 = forge.asn1.fromDer(p12Content);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, keyPassword);

    console.log('P12 parse success. Bags found:', Object.keys(p12.bags));

    let signingKey = null;
    let foundType = null;

    // Check Shrouded Bags
    const shroudedBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (shroudedBags && shroudedBags.length > 0) {
        console.log('Found pkcs8ShroudedKeyBag');
        signingKey = shroudedBags[0].key;
        foundType = 'pkcs8ShroudedKeyBag';
    }

    // Check regular Key Bags
    if (!signingKey) {
        const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
        if (keyBags && keyBags.length > 0) {
            console.log('Found keyBag');
            signingKey = keyBags[0].key;
            foundType = 'keyBag';
        }
    }

    if (!signingKey) {
        console.log('Manual search through all bags...');
        for (const type in p12.bags) {
            const bags = p12.bags[type];
            for (const bag of bags) {
                if (bag.key) {
                    console.log('Found key in bag type:', type);
                    signingKey = bag.key;
                    foundType = type;
                    break;
                }
            }
            if (signingKey) break;
        }
    }

    if (!signingKey) {
        throw new Error('No private key found in P12 file.');
    }

    console.log('Successfully found signing key (Type: ' + foundType + ')');

    const url = baseURL + '/global-processing/core/clients';
    const method = 'POST';
    const body = JSON.stringify({ test: 'data' });

    console.log('Test Request URL:', url);
    console.log('Test Request Method:', method);

    console.log('--- TEST 1: Sign with Forge Object ---');
    try {
        const auth1 = oauth.getAuthorizationHeader(url, method, body, consumerKey, signingKey);
        console.log('SUCCESS: Sign with Forge Object');
        console.log('Header snippet:', auth1.substring(0, 50) + '...');
    } catch (e1) {
        console.error('FAILED: Sign with Forge Object:', e1.message);
    }

    console.log('--- TEST 2: Sign with PEM String ---');
    try {
        const signingKeyPem = forge.pki.privateKeyToPem(signingKey);
        const auth2 = oauth.getAuthorizationHeader(url, method, body, consumerKey, signingKeyPem);
        console.log('SUCCESS: Sign with PEM String');
        console.log('Header snippet:', auth2.substring(0, 50) + '...');
    } catch (e2) {
        console.error('FAILED: Sign with PEM String:', e2.message);
    }

} catch (err) {
    console.error('DIAGNOSTIC CRITICAL FAILURE:', err.message);
    if (err.stack) console.error(err.stack);
}
