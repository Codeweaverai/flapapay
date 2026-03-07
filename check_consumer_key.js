require('dotenv').config();

const fullKey = process.env.MASTERCARD_CONSUMER_KEY;
console.log('Full key:', fullKey);
console.log('Full key length:', fullKey.length);

// Check if there's a '!' separator
const parts = fullKey.split('!');
if (parts.length > 1) {
    console.log('\nKey appears to have parts separated by "!"');
    console.log('Part 1 (before !):', parts[0]);
    console.log('Part 1 length:', parts[0].length);
    console.log('Part 2 (after !):', parts[1]);
    console.log('Part 2 length:', parts[1].length);
}

// Mastercard consumer keys are typically ~42 characters
// The format might be: consumerKey!keyIdentifier
