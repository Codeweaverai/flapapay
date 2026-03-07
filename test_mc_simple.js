const axios = require('axios');
const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

const consumerKey = 'FpRqhcc0WOXk6VtN_Sjz7yEy1gt92mkDtQ4Lifmb8f80b843!14ae4d71c97241339cef940aa621cb230000000000000000';
const keyFilePath = 'keys\\FlapaPaySandbox-sandbox.p12';
const keyPassword = 'Mukanda2012!';
const baseURL = 'https://sandbox.api.mastercard.com';

async function testSimpleEndpoint() {
    console.log('=== Testing Simple Mastercard API Endpoint ===\n');
    
    // Load key
    const p12Content = fs.readFileSync(keyFilePath, 'binary');
    const p12Asn1 = forge.asn1.fromDer(p12Content, false);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, keyPassword);
    
    let keyBag;
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0]) {
        keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    }
    const signingKey = forge.pki.privateKeyToPem(keyBag.key);
    console.log('✓ Signing key loaded\n');
    
    // Try a simple GET request (no body hash needed)
    console.log('=== Test: GET /global-processing/core/clients (List) ===');
    
    try {
        const url = `${baseURL}/global-processing/core/clients`;
        const auth = oauth.getAuthorizationHeader(
            url,
            'GET',
            null,
            consumerKey,
            signingKey
        );
        
        console.log('Authorization header (first 100 chars):', auth.substring(0, 100) + '...');
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': auth,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('✗ API Error:', error.response?.status);
        
        if (error.response?.status === 403 && error.response?.data?.includes?.('html')) {
            console.error('WAF Block: Mastercard security firewall blocked the request');
            console.error('Support ID:', error.response?.data?.match(/support ID is: (\d+)/)?.[1]);
            console.error('\nThis means:');
            console.error('  - Your IP may not be whitelisted');
            console.error('  - Too many failed requests (rate limited)');
            console.error('  - Contact Mastercard support with the Support ID');
        } else if (error.response?.data?.Errors?.Error) {
            console.error('Error Details:');
            error.response.data.Errors.Error.forEach(e => {
                console.error(`  ${e.ReasonCode}: ${e.Description}`);
            });
        } else {
            console.error('Response:', error.response?.data);
        }
    }
}

testSimpleEndpoint();
