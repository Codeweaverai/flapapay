const axios = require('axios');
const fs = require('fs');
const forge = require('node-forge');
const oauth = require('mastercard-oauth1-signer');
// const mcClientEncryption = require('mastercard-client-encryption'); // Required for POST/PUT if payload encryption is fully enforced, implementing base first.

class MastercardCardService {
    constructor() {
        this.baseURL = process.env.MASTERCARD_API_BASE_URL || 'https://sandbox.api.mastercard.com';
        this.consumerKey = process.env.MASTERCARD_CONSUMER_KEY;
        this.keyFilePath = process.env.MASTERCARD_KEY_FILE_PATH;
        this.keyPassword = process.env.MASTERCARD_KEY_PASSWORD;

        // This will hold the parsed forge private key object needed by the Mastercard SDK
        this.signingKey = null;
        this.initializeSigningKey();
    }

    initializeSigningKey() {
        if (!this.keyFilePath || !fs.existsSync(this.keyFilePath)) {
            console.error('[Mastercard] P12 Key file not found at:', this.keyFilePath);
            return;
        }

        try {
            console.log('[Mastercard] Loading P12 certificate for OAuth1 Signer...');
            const p12Content = fs.readFileSync(this.keyFilePath, 'binary');
            const p12Asn1 = forge.asn1.fromDer(p12Content, false);
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.keyPassword);

            // Extract the private key using fallback method
            let keyBag;
            const keyBags = p12.getBags({
                friendlyName: 'keyalias',
                bagType: forge.pki.oids.pkcs8ShroudedKeyBag
            });
            
            if (keyBags.friendlyName && keyBags.friendlyName[0]) {
                keyBag = keyBags.friendlyName[0];
            } else {
                // Fallback: get any key bag
                const allBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
                const bags = allBags[forge.pki.oids.pkcs8ShroudedKeyBag];
                if (bags && bags[0]) {
                    keyBag = bags[0];
                }
            }

            if (!keyBag || !keyBag.key) {
                throw new Error('Failed to extract private key from P12');
            }

            // Convert to PEM format as required by mastercard-oauth1-signer
            this.signingKey = forge.pki.privateKeyToPem(keyBag.key);
            console.log('[Mastercard] Signing key successfully loaded (PEM format).');
        } catch (error) {
            console.error('[Mastercard] Error initializing signing key from P12:', error.message);
        }
    }

    // A generic method to make signed requests to the Mastercard APIs
    async makeRequest(method, endpoint, data = null) {
        if (!this.signingKey) {
            throw new Error('Mastercard signing key is not initialized. Check your .env configuration.');
        }

        const url = `${this.baseURL}${endpoint}`;

        // 1. Prepare the Axios configuration
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

        // 2. The Mastercard SDK provides a utility function `oauth.sign` 
        // that generates the Authorization header based on the URL, method, payload, and the .p12 private key.
        const authHeader = oauth.getAuthorizationHeader(
            url,
            method.toUpperCase(),
            data ? JSON.stringify(data) : null,
            this.consumerKey,
            this.signingKey
        );

        config.headers['Authorization'] = authHeader;

        // 3. Execute the request
        try {
            console.log(`[Mastercard API] ${method.toUpperCase()} ${endpoint}`);
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`[Mastercard API Error] ${method.toUpperCase()} ${endpoint} failed:`, error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }

    // --- Core Processing Wrapper Methods ---

    /**
     * Create a Client
     * DOCS: POST /clients
     */
    async createClient(clientData) {
        // Mastercard Processing Core requires specific fields
        const payload = {
            clientNumber: clientData.clientNumber || `CLI_${Date.now()}`,
            clientType: clientData.clientType || 'PR', // PR = Private/Individual
            serviceGroupCode: clientData.serviceGroupCode || '021',
            orderDepartment: clientData.orderDepartment || 'ONLINE',
            clientPersonalData: {
                firstName: clientData.personalInfo?.firstName || 'John',
                lastName: clientData.personalInfo?.lastName || 'Doe',
                birthDate: clientData.personalInfo?.dateOfBirth || '1990-01-01',
                title: clientData.personalInfo?.title || 'MR',
                gender: clientData.personalInfo?.gender || 'M',
                language: clientData.personalInfo?.language || 'en'
            },
            clientBaseAddressData: {
                addressLine1: clientData.address?.line1 || '123 Main Street',
                city: clientData.address?.city || 'Lusaka',
                postalCode: clientData.address?.postalCode || '10101',
                country: clientData.address?.country || 'ZMB'
            },
            clientContactData: {
                email: clientData.contact?.email || 'client@example.com',
                phoneNumberMobile: clientData.contact?.phone || '260970000000'
            },
            embossedData: {
                firstName: (clientData.personalInfo?.firstName || 'John').toUpperCase(),
                lastName: (clientData.personalInfo?.lastName || 'Doe').toUpperCase()
            }
        };
        return this.makeRequest('POST', '/processing/core/clients', payload);
    }

    /**
     * Create an Account Contract
     * DOCS: POST /accounts
     */
    async createAccount(accountData) {
        // Mastercard Processing Core requires specific fields
        const payload = {
            accountContractData: {
                accountContractNumber: `ACC_${Date.now()}`,
                productCode: accountData.productCode || 'STD-DEBCH-USD', // Standard Debit USD
                clientId: accountData.clientIdentifier, // Note: uses clientId not clientIdentifier
                currency: accountData.currency || 'USD',
                serviceGroupCode: accountData.serviceGroupCode || '021'
            }
        };
        return this.makeRequest('POST', '/processing/core/accounts', payload);
    }

    /**
     * Create a Card Contract (Issues the Virtual Card)
     * DOCS: POST /cards
     */
    async createCard(cardData) {
        // Mastercard Processing Core requires specific fields
        const payload = {
            accountContractId: cardData.accountIdentifier,
            clientId: cardData.clientIdentifier,
            cardContract: {
                cardContractNumber: cardData.cardNumber || `535584${Date.now().toString().slice(-10)}`,
                productCode: cardData.productCode || 'STD-MCDEBVF-USD', // Standard Mastercard Debit Virtual
                currency: cardData.currency || 'USD',
                cardExpiryDate: cardData.expiryDate || '3012', // YYMM format
                embossedData: {
                    firstName: cardData.embossedData?.firstName || 'JOHN',
                    lastName: cardData.embossedData?.lastName || 'DOE'
                }
            }
        };
        return this.makeRequest('POST', '/processing/core/cards', payload);
    }

    /**
     * Activate a Card Plastic
     * DOCS: PUT /cards/{id}/active
     */
    async activateCard(cardContractId) {
        // According to docs, PUT /active activates the plastic. Body depends on specific API requirements.
        return this.makeRequest('PUT', `/processing/core/cards/${cardContractId}/active`, { active: true });
    }

    /**
     * Retrieve Card Details (For revealing PAN/CVV)
     * DOCS: GET /cards/{id}
     */
    async getCardDetails(cardContractId) {
        return this.makeRequest('GET', `/processing/core/cards/${cardContractId}`);
    }

    /**
     * Post a Credit Transaction (Fund the card)
     * DOCS: POST /contracts/{id}/credits
     */
    async fundCard(cardContractId, amount, currency) {
        const payload = {
            amount: amount,
            currency: currency,
            transactionType: 'CREDIT',
            description: 'FlapaPay Wallet Funding'
        };
        return this.makeRequest('POST', `/processing/core/contracts/${cardContractId}/credits`, payload);
    }

    /**
     * Post a Debit Transaction (Withdraw from card)
     * DOCS: POST /contracts/{id}/debits
     */
    async withdrawFromCard(cardContractId, amount, currency) {
        const payload = {
            amount: amount,
            currency: currency,
            transactionType: 'DEBIT',
            description: 'FlapaPay Wallet Withdrawal'
        };
        return this.makeRequest('POST', `/processing/core/contracts/${cardContractId}/debits`, payload);
    }

    /**
     * Update Card Status (Block/Unblock)
     * DOCS: PUT /cards/{id}/status
     */
    async updateCardStatus(cardContractId, status) {
        // status is usually 'BLOCKED' or 'ACTIVE' (in MC core it might be specific internal codes)
        return this.makeRequest('PUT', `/processing/core/cards/${cardContractId}/status`, { status: status });
    }
}

module.exports = new MastercardCardService();
