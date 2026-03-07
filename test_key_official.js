const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

const keyFilePath = 'keys\\FlapaPaySandbox-sandbox.p12';
const keyPassword = 'Mukanda2012!';
const consumerKey = 'FpRqhcc0WOXk6VtN_Sjz7yEy1gt92mkDtQ4Lifmb8f80b843!a6ec584cb0064d8085fbed0cba9470730000000000000000';

console.log('=== Testing Mastercard Key Loading (Official Method) ===\n');

try {
    // Load P12
    console.log('1. Loading P12 file...');
    const p12Content = fs.readFileSync(keyFilePath, 'binary');
    const p12Asn1 = forge.asn1.fromDer(p12Content, false);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, keyPassword);
    console.log('✓ P12 loaded');
    
    // Extract key using friendlyName method (as per official docs)
    console.log('2. Extracting private key...');
    const keyBags = p12.getBags({
        friendlyName: 'keyalias',  // Try default alias
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag
    });
    
    let keyObj;
    if (keyBags.friendlyName && keyBags.friendlyName[0]) {
        console.log('✓ Found key by friendlyName: keyalias');
        keyObj = keyBags.friendlyName[0];
    } else {
        // Fallback: try to get any key bag
        console.log('Trying fallback method...');
        const allBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const bags = allBags[forge.pki.oids.pkcs8ShroudedKeyBag];
        if (bags && bags[0]) {
            keyObj = bags[0];
            console.log('✓ Found key via fallback');
        } else {
            // Try localKeyId
            console.log('Trying localKeyId method...');
            const keyIdBags = p12.getBags({ localKeyId: null });
            if (keyIdBags[forge.pki.oids.pkcs8ShroudedKeyBag] && 
                keyIdBags[forge.pki.oids.pkcs8ShroudedKeyBag][0]) {
                keyObj = keyIdBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
                console.log('✓ Found key via localKeyId');
            } else {
                console.error('✗ Could not find any valid key bag');
                console.log('Available bags:', Object.keys(allBags));
                process.exit(1);
            }
        }
    }
    
    // Convert to PEM format (as recommended in docs)
    const signingKey = forge.pki.privateKeyToPem(keyObj.key);
    console.log('✓ Key converted to PEM format');
    console.log('Key type:', keyObj.key.type);
    
    // Test signing
    console.log('\n3. Testing OAuth1 signing...');
    const testUrl = 'https://sandbox.api.mastercard.com/global-processing/core/clients';
    const testMethod = 'POST';
    const testData = { clientType: 'INDIVIDUAL' };
    
    const authHeader = oauth.getAuthorizationHeader(
        testUrl,
        testMethod,
        JSON.stringify(testData),
        consumerKey,
        signingKey
    );
    
    console.log('✓ SUCCESS - Signing works!');
    console.log('Authorization header (first 150 chars):', authHeader.substring(0, 150) + '...');
    console.log('\n=== Key is working correctly ===');
    
} catch (error) {
    console.error('✗ Error:', error.message);
    console.error('\nStack:', error.stack);
}
