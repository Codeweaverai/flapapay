/**
 * Test script to verify Mastercard API endpoints and authentication
 */
require('dotenv').config();
const axios = require('axios');
const oauth = require('mastercard-oauth1-signer');
const fs = require('fs');
const forge = require('node-forge');

const MASTERCARD_API_BASE_URL = process.env.MASTERCARD_API_BASE_URL || 'https://sandbox.api.mastercard.com';
const MASTERCARD_CONSUMER_KEY = process.env.MASTERCARD_CONSUMER_KEY;
const MASTERCARD_KEY_FILE_PATH = process.env.MASTERCARD_KEY_FILE_PATH;
const MASTERCARD_KEY_PASSWORD = process.env.MASTERCARD_KEY_PASSWORD;

let signingKey = null;

function loadSigningKey() {
    if (!fs.existsSync(MASTERCARD_KEY_FILE_PATH)) {
        console.error('P12 Key file not found at:', MASTERCARD_KEY_FILE_PATH);
        return false;
    }

    try {
        const p12Content = fs.readFileSync(MASTERCARD_KEY_FILE_PATH, 'binary');
        const p12Asn1 = forge.asn1.fromDer(p12Content, false);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, MASTERCARD_KEY_PASSWORD);

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const bags = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
        
        if (bags && bags[0] && bags[0].key) {
            signingKey = forge.pki.privateKeyToPem(bags[0].key);
            console.log('✓ Signing key loaded successfully');
            return true;
        } else {
            console.error('Failed to extract private key from P12');
            return false;
        }
    } catch (error) {
        console.error('Error loading signing key:', error.message);
        return false;
    }
}

async function makeRequest(method, endpoint, data = null) {
    const url = `${MASTERCARD_API_BASE_URL}${endpoint}`;
    const config = {
        method: method.toUpperCase(),
        url: url,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    };

    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
        config.data = data;
    }

    const authHeader = oauth.getAuthorizationHeader(
        url,
        method.toUpperCase(),
        data ? JSON.stringify(data) : null,
        MASTERCARD_CONSUMER_KEY,
        signingKey
    );

    config.headers['Authorization'] = authHeader;

    try {
        console.log(`\n→ ${method.toUpperCase()} ${endpoint}`);
        const response = await axios(config);
        console.log('✓ Response:', response.status);
        return response.data;
    } catch (error) {
        console.log(`✗ Error ${error.response?.status}:`, JSON.stringify(error.response?.data, null, 2) || error.message);
        throw error;
    }
}

async function testEndpoints() {
    console.log('=== Mastercard API Endpoint Testing ===\n');
    console.log('Base URL:', MASTERCARD_API_BASE_URL);
    console.log('Consumer Key:', MASTERCARD_CONSUMER_KEY?.substring(0, 20) + '...');
    
    if (!loadSigningKey()) {
        console.error('\n✗ Failed to load signing key. Exiting.');
        return;
    }

    // Test 1: Try different API endpoint patterns
    const endpointsToTest = [
        // Global Processing API (most common for card issuing)
        { path: '/processing/core/v1/clients', method: 'POST', data: { clientNumber: 'TEST001' } },
        { path: '/global-processing/core/v1/clients', method: 'POST', data: { clientNumber: 'TEST001' } },
        { path: '/v1/processing/clients', method: 'POST', data: { clientNumber: 'TEST001' } },
        
        // Issuing API
        { path: '/issuing/v1/cards', method: 'GET' },
        { path: '/v1/issuing/cards', method: 'GET' },
        
        // Test with simple GET first
        { path: '/health', method: 'GET' },
        { path: '/', method: 'GET' },
    ];

    for (const test of endpointsToTest) {
        try {
            await makeRequest(test.method, test.path, test.data);
            console.log(`✓ SUCCESS: ${test.path}`);
            break;
        } catch (e) {
            // Continue testing
        }
    }

    console.log('\n=== Testing Complete ===');
}

testEndpoints().catch(console.error);
