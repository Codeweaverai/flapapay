const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');

const consumerKey = 'FpRqhcc0WOXk6VtN_Sjz7yEy1gt92mkDtQ4Lifmb8f80b843!a6ec584cb0064d8085fbed0cba9470730000000000000000';

// Try different key files and passwords
const configs = [
    {
        name: 'Flapapay-sandbox-signing.p12 (Mukanda2012!)',
        file: 'keys\\Flapapay-sandbox-signing.p12',
        password: 'Mukanda2012!'
    },
    {
        name: 'mbolelapule1992-mastercard-encryption-key.p12 (Mukanda2012!)',
        file: 'keys\\mbolelapule1992-mastercard-encryption-key.p12',
        password: 'Mukanda2012!'
    },
    {
        name: 'mbolelapule1992-mastercard-encryption-key.p12 (admin123)',
        file: 'keys\\mbolelapule1992-mastercard-encryption-key.p12',
        password: 'admin123'
    },
    {
        name: 'mbolelapule1992-mastercard-encryption-key.p12 (password)',
        file: 'keys\\mbolelapule1992-mastercard-encryption-key.p12',
        password: 'password'
    }
];

console.log('=== Testing Multiple Key Configurations ===\n');

for (const config of configs) {
    console.log(`Testing: ${config.name}`);
    
    if (!fs.existsSync(config.file)) {
        console.log('  ✗ File not found\n');
        continue;
    }
    
    try {
        const p12Content = fs.readFileSync(config.file, 'binary');
        const p12Asn1 = forge.asn1.fromDer(p12Content);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, config.password);
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
        
        if (!keyBag || !keyBag.key) {
            console.log('  ✗ Failed to extract key\n');
            continue;
        }
        
        // Try signing
        const authHeader = oauth.getAuthorizationHeader(
            'https://sandbox.api.mastercard.com/global-processing/core/clients',
            'POST',
            JSON.stringify({ clientType: 'INDIVIDUAL' }),
            consumerKey,
            keyBag.key
        );
        
        console.log('  ✓ SUCCESS - Signing works!\n');
        console.log('  RECOMMENDATION: Update .env with:');
        console.log(`    MASTERCARD_KEY_FILE_PATH=${config.file}`);
        console.log(`    MASTERCARD_KEY_PASSWORD=${config.password}\n`);
        break;
        
    } catch (error) {
        console.log(`  ✗ Failed: ${error.message}\n`);
    }
}

console.log('=== Test Complete ===');
