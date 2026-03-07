const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

const keyFilePath = 'keys\\Flapapay-sandbox-signing.p12';
const keyPassword = 'Mukanda2012!';
const consumerKey = 'FpRqhcc0WOXk6VtN_Sjz7yEy1gt92mkDtQ4Lifmb8f80b843!a6ec584cb0064d8085fbed0cba9470730000000000000000';

console.log('=== Testing Mastercard Key Loading ===\n');

// 1. Check file exists
console.log('1. Checking key file...');
if (!fs.existsSync(keyFilePath)) {
    console.error('✗ Key file NOT found at:', keyFilePath);
    process.exit(1);
}
console.log('✓ Key file found');

// 2. Load P12
console.log('\n2. Loading P12 certificate...');
try {
    const p12Content = fs.readFileSync(keyFilePath, 'binary');
    console.log('✓ P12 file read successfully (%d bytes)', p12Content.length);
    
    const p12Asn1 = forge.asn1.fromDer(p12Content);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, keyPassword);
    console.log('✓ P12 parsed successfully');
    
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    
    if (!keyBag || !keyBag.key) {
        console.error('✗ Failed to extract private key from P12');
        process.exit(1);
    }
    
    const signingKey = keyBag.key;
    console.log('✓ Private key extracted successfully');
    
    // 3. Test signing
    console.log('\n3. Testing OAuth1 signing...');
    const testUrl = 'https://sandbox.api.mastercard.com/global-processing/core/clients';
    const testMethod = 'POST';
    const testData = { clientType: 'INDIVIDUAL' };
    
    try {
        const authHeader = oauth.getAuthorizationHeader(
            testUrl,
            testMethod,
            JSON.stringify(testData),
            consumerKey,
            signingKey
        );
        console.log('✓ Signing successful!');
        console.log('Authorization header (first 100 chars):', authHeader.substring(0, 100) + '...');
        console.log('\n=== SUCCESS: Key and signing are working correctly ===');
    } catch (signError) {
        console.error('✗ Signing failed:', signError.message);
        console.error('\nThis confirms the issue - the signing key cannot be used to sign requests.');
        console.error('Possible causes:');
        console.error('  - Wrong key password');
        console.error('  - Corrupted P12 file');
        console.error('  - Incompatible key format');
    }
    
} catch (error) {
    console.error('✗ Error loading P12:', error.message);
    process.exit(1);
}
