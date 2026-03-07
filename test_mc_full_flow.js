const axios = require('axios');
const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

const consumerKey = 'FpRqhcc0WOXk6VtN_Sjz7yEy1gt92mkDtQ4Lifmb8f80b843!14ae4d71c97241339cef940aa621cb230000000000000000';
const keyFilePath = 'keys\\FlapaPaySandbox-sandbox.p12';
const keyPassword = 'Mukanda2012!';
const baseURL = 'https://sandbox.api.mastercard.com';

async function testFullFlow() {
    console.log('=== Testing Full Mastercard API Flow ===\n');
    
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
        const clientUrl = `${baseURL}/processing/core/clients`;
        const clientAuth = oauth.getAuthorizationHeader(
            clientUrl,
            'POST',
            JSON.stringify(clientPayload),
            consumerKey,
            signingKey
        );
        
        const clientRes = await axios.post(clientUrl, clientPayload, {
            headers: {
                'Authorization': clientAuth,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ Client created successfully!');
        console.log('Client ID:', clientRes.data.clients[0].clientIdentifier);
        const clientId = clientRes.data.clients[0].clientIdentifier;
        
        // Test 2: Create Account
        console.log('\n=== Test 2: Creating Account ===');
        const accountPayload = {
            clientIdentifier: clientId,
            currency: 'USD',
            accountType: 'PREPAID'
        };
        
        const accountUrl = `${baseURL}/processing/core/accounts`;
        const accountAuth = oauth.getAuthorizationHeader(
            accountUrl,
            'POST',
            JSON.stringify(accountPayload),
            consumerKey,
            signingKey
        );
        
        const accountRes = await axios.post(accountUrl, accountPayload, {
            headers: {
                'Authorization': accountAuth,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ Account created successfully!');
        console.log('Account ID:', accountRes.data.accounts[0].accountIdentifier);
        const accountId = accountRes.data.accounts[0].accountIdentifier;
        
        // Test 3: Create Card
        console.log('\n=== Test 3: Creating Card ===');
        const cardPayload = {
            accountIdentifier: accountId,
            clientIdentifier: clientId,
            cardProductClass: 'VIRTUAL',
            currency: 'USD'
        };
        
        const cardUrl = `${baseURL}/processing/core/cards`;
        const cardAuth = oauth.getAuthorizationHeader(
            cardUrl,
            'POST',
            JSON.stringify(cardPayload),
            consumerKey,
            signingKey
        );
        
        const cardRes = await axios.post(cardUrl, cardPayload, {
            headers: {
                'Authorization': cardAuth,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✓ Card created successfully!');
        console.log('Card ID:', cardRes.data.cards[0].cardIdentifier);
        
    } catch (error) {
        console.error('✗ API Error:', error.response?.status);
        console.error('Full Response:', JSON.stringify(error.response?.data, null, 2));
        
        if (error.response?.data?.Errors?.Error) {
            console.error('\n=== Error Details ===');
            error.response.data.Errors.Error.forEach(e => {
                console.error(`Source: ${e.Source}`);
                console.error(`ReasonCode: ${e.ReasonCode}`);
                console.error(`Description: ${e.Description}`);
                console.error('---');
            });
        }
    }
}

testFullFlow();
