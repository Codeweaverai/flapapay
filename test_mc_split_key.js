const axios = require('axios');
const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

// Use only the part BEFORE the '!' as the consumer key
const fullConsumerKey = 'FpRqhcc0WOXk6VtN_Sjz7yEy1gt92mkDtQ4Lifmb8f80b843!a6ec584cb0064d8085fbed0cba9470730000000000000000';
const consumerKey = fullConsumerKey.split('!')[0];  // Just the first part

const keyFilePath = 'keys\\Flapapay-sandbox-signing.p12';
const keyPassword = 'Mukanda2012!';
const baseURL = 'https://sandbox.api.mastercard.com';

console.log('Using Consumer Key:', consumerKey);
console.log('Key length:', consumerKey.length);
console.log('');

async function testMastercardAPI() {
    console.log('=== Testing Mastercard Global Processing API ===\n');
    
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
    
    // Test 1: Create Client
    console.log('=== Test 1: Creating Client ===');
    const clientPayload = {
        clientType: 'INDIVIDUAL',
        personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            dateOfBirth: '1990-01-01'
        },
        address: {
            line1: '123 Test Street',
            city: 'Lusaka',
            postalCode: '10101',
            country: 'ZMB'
        }
    };
    
    try {
        const clientUrl = `${baseURL}/global-processing/core/clients`;
        const clientAuth = oauth.getAuthorizationHeader(
            clientUrl,
            'POST',
            JSON.stringify(clientPayload),
            consumerKey,
            signingKey
        );
        
        console.log('Authorization header (first 100 chars):', clientAuth.substring(0, 100) + '...');
        console.log('Sending request...');
        
        const clientRes = await axios.post(clientUrl, clientPayload, {
            headers: {
                'Authorization': clientAuth,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ Client created successfully!');
        console.log('Response:', JSON.stringify(clientRes.data, null, 2));
        
    } catch (error) {
        console.error('✗ API Error:', error.response?.status);
        console.error('Full Response:', JSON.stringify(error.response?.data, null, 2));
        if (error.response?.data?.Errors?.Error) {
            console.error('\nError details:');
            error.response.data.Errors.Error.forEach(e => {
                console.error(`  - ${e.Source}: ${e.Description}`);
            });
        }
    }
}

testMastercardAPI();
