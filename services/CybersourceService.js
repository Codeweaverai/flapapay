require('dotenv').config();
const cs = require('cybersource-rest-client');
const { v4: uuidv4 } = require('uuid');

// ─── SDK Configuration ────────────────────────────────────────────────────────
const configObject = {
  authenticationType: 'http_signature',
  runEnvironment:     process.env.CYBERSOURCE_ENVIRONMENT || 'apitest.cybersource.com',
  merchantID:         process.env.CYBERSOURCE_MERCHANT_ID,
  merchantKeyId:      process.env.CYBERSOURCE_KEY_ID,
  merchantsecretKey:  process.env.CYBERSOURCE_SECRET_KEY,
  logConfiguration:   { enableLog: false },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────
function makeClient(ApiClass) {
  return new ApiClass(configObject, new cs.ApiClient());
}

function ref(prefix = 'FLAPA') {
  return `${prefix}-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
}

function wrap(fn) {
  return new Promise((resolve, reject) => {
    try {
      fn((error, data) => {
        if (error) {
          // Log full diagnostic info synchronously
          try {
            const diag = {
              status:   error?.status || error?.response?.status,
              url:      error?.response?.req?.url,
              reqBody:  error?.response?.config?.data || error?.response?.req?._data,
              respText: error?.response?.text,
              msg:      error?.message,
            };
            require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
              '[CS-ERR] ' + JSON.stringify(diag) + '\n');
          } catch(e) {}

          const body = error?.response?.text || error?.response?.body || error?.message;
          const msg  = typeof body === 'object' ? JSON.stringify(body) : String(body || error);
          return reject(new Error(msg));
        }
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// =============================================================================
// 1. PAYMENTS — Authorize, Capture, Void, Refund, Reversal, Sale
// =============================================================================
const payments = {

  // Authorize only — holds funds without charging (used for escrow, pre-auth)
  // Set capture:true for a direct sale (auth + capture in one call)
  async authorize({ amount, currency, customerId, transientToken, capture = false, metadata = {} }) {
    const client = makeClient(cs.PaymentsApi);
    const req    = new cs.CreatePaymentRequest();

    const clientRef  = new cs.Ptsv2paymentsClientReferenceInformation();
    clientRef.code   = metadata.ref || ref('AUTH');
    req.clientReferenceInformation = clientRef;

    const orderInfo     = new cs.Ptsv2paymentsOrderInformation();
    const amountDetails = new cs.Ptsv2paymentsOrderInformationAmountDetails();
    amountDetails.totalAmount = String(parseFloat(amount).toFixed(2));
    amountDetails.currency    = currency.toUpperCase();
    orderInfo.amountDetails   = amountDetails;
    req.orderInformation      = orderInfo;

    const paymentInfo = new cs.Ptsv2paymentsPaymentInformation();
    if (customerId) {
      const customer      = new cs.Ptsv2paymentsPaymentInformationCustomer();
      customer.customerId = customerId;
      paymentInfo.customer = customer;
    } else if (transientToken) {
      const tokenizedCard              = new cs.Ptsv2paymentsPaymentInformationTokenizedCard();
      tokenizedCard.transientToken     = transientToken;
      paymentInfo.tokenizedCard        = tokenizedCard;
    } else {
      throw new Error('[CyberSource] authorize: provide customerId or transientToken');
    }
    req.paymentInformation = paymentInfo;

    const processingInfo  = new cs.Ptsv2paymentsProcessingInformation();
    processingInfo.capture = capture;
    req.processingInformation = processingInfo;

    const data = await wrap(cb => client.createPayment(req, cb));
    console.log(`[CyberSource] Auth ${amount} ${currency} → ${data.id} (${data.status})`);
    return {
      id:       data.id,
      status:   data.status,                                   // AUTHORIZED | DECLINED
      authCode: data.processorInformation?.approvalCode,
      last4:    data.paymentAccountInformation?.card?.suffix,
      network:  data.paymentAccountInformation?.card?.type,
      raw:      data,
    };
  },

  // Sale = authorize + capture in one step (standard checkout payment)
  async sale(params) {
    return payments.authorize({ ...params, capture: true, metadata: { ...params.metadata, ref: ref('SALE') } });
  },

  // Capture a previously authorized payment
  async capture(paymentId, amount, currency) {
    const client = makeClient(cs.CaptureApi);
    const req    = new cs.CapturePaymentRequest();

    const orderInfo     = new cs.Ptsv2paymentsidcapturesOrderInformation();
    const amountDetails = new cs.Ptsv2paymentsidcapturesOrderInformationAmountDetails();
    amountDetails.totalAmount = String(parseFloat(amount).toFixed(2));
    amountDetails.currency    = currency.toUpperCase();
    orderInfo.amountDetails   = amountDetails;
    req.orderInformation      = orderInfo;

    const data = await wrap(cb => client.capturePayment(req, paymentId, cb));
    console.log(`[CyberSource] Captured ${amount} ${currency} → payment ${paymentId} (${data.status})`);
    return { id: data.id, status: data.status, raw: data };
  },

  // Void an authorized or captured payment
  async void(paymentId) {
    const client = makeClient(cs.VoidApi);
    const req    = new cs.VoidPaymentRequest();

    const clientRef = new cs.Ptsv2voidClientReferenceInformation();
    clientRef.code  = ref('VOID');
    req.clientReferenceInformation = clientRef;

    const data = await wrap(cb => client.voidPayment(req, paymentId, cb));
    console.log(`[CyberSource] Voided payment ${paymentId} (${data.status})`);
    return { id: data.id, status: data.status, raw: data };
  },

  // Refund a captured payment (linked refund)
  async refund(paymentId, amount, currency) {
    const client = makeClient(cs.RefundApi);
    const req    = new cs.RefundPaymentRequest();

    const orderInfo     = new cs.Ptsv2paymentsidrefundsOrderInformation();
    const amountDetails = new cs.Ptsv2paymentsidrefundsOrderInformationAmountDetails();
    amountDetails.totalAmount = String(parseFloat(amount).toFixed(2));
    amountDetails.currency    = currency.toUpperCase();
    orderInfo.amountDetails   = amountDetails;
    req.orderInformation      = orderInfo;

    const data = await wrap(cb => client.refundPayment(req, paymentId, cb));
    console.log(`[CyberSource] Refunded ${amount} ${currency} on payment ${paymentId} (${data.status})`);
    return { id: data.id, status: data.status, raw: data };
  },

  // Auth reversal — releases an authorization hold immediately
  async reverse(paymentId, amount, currency) {
    const client = makeClient(cs.ReversalApi);
    const req    = new cs.AuthReversalRequest();

    const orderInfo     = new cs.Ptsv2paymentsidreversalsOrderInformation();
    const amountDetails = new cs.Ptsv2paymentsidreversalsOrderInformationAmountDetails();
    amountDetails.totalAmount = String(parseFloat(amount).toFixed(2));
    amountDetails.currency    = currency.toUpperCase();
    orderInfo.amountDetails   = amountDetails;
    req.orderInformation      = orderInfo;

    const data = await wrap(cb => client.authReversal(req, paymentId, cb));
    console.log(`[CyberSource] Reversed auth ${paymentId} (${data.status})`);
    return { id: data.id, status: data.status, raw: data };
  },
};

// =============================================================================
// 2. TOKEN MANAGEMENT SERVICE (TMS)
//    Customer → PaymentInstrument — replaces Stripe saved payment methods
// =============================================================================
const tokens = {

  // Create a CyberSource customer token — call once per FlapaPay user on first card link
  // Store result as users.cybersource_customer_id
  async createCustomer({ userId, email, name = '' }) {
    const client = makeClient(cs.CustomerApi);
    const req    = new cs.PostCustomerRequest();

    const clientRef = new cs.Tmsv2tokenizeTokenInformationCustomerClientReferenceInformation();
    clientRef.code  = `FLAPA-USER-${userId}`;
    req.clientReferenceInformation = clientRef;

    const buyerInfo              = new cs.Tmsv2tokenizeTokenInformationCustomerBuyerInformation();
    buyerInfo.merchantCustomerID = String(userId);
    buyerInfo.email              = email;
    req.buyerInformation = buyerInfo;

    const data = await wrap(cb => client.postCustomer(req, {}, cb));
    console.log(`[CyberSource] Created customer token ${data.id} for user ${userId}`);
    return data.id;
  },

  // Link a card via Flex Microform v2 transient token JWT.
  // Uses a $0 auth + TOKEN_CREATE on Payments API as a plain JS object
  // (bypasses SDK model field filtering so transientToken is preserved).
  // The $0 auth is voided immediately after token IDs are extracted.
  async linkCard({ customerId, transientToken, billingAddress = {}, userEmail = '' }) {
    // ── 1. Decode Flex JWT payload → extract card details ──────────────────
    let last4, brand, expirationMonth, expirationYear;
    try {
      const parts = transientToken.split('.');
      if (parts.length < 2) throw new Error('Not a JWT');
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      b64 += '='.repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      const card = payload?.content?.paymentInformation?.card;
      last4           = card?.number?.maskedValue?.slice(-4);
      expirationMonth = card?.expirationMonth?.value;
      expirationYear  = card?.expirationYear?.value;
      const typeMap   = { '001': 'VISA', '002': 'MASTERCARD', '003': 'AMEX', '004': 'DISCOVER', '007': 'JCB' };
      brand           = typeMap[card?.type?.value] || card?.type?.value;
      require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
        `[JWT-decoded] last4=${last4} brand=${brand} exp=${expirationMonth}/${expirationYear}\n`);
    } catch (e) {
      require('fs').appendFileSync('C:\\FlapaPay\\debug.log', `[JWT-decode-err] ${e.message}\n`);
      throw new Error('Invalid Flex token: ' + e.message);
    }

    // ── 2. $0 auth with TOKEN_CREATE ──────────────────────────────────────
    // tokenInformation.transientTokenJwt is the correct SDK field for the
    // Flex Microform v2 JWT.  paymentInformation.customer causes CyberSource
    // to look up an existing card number — omit it here; we link the returned
    // instrumentId to the customer ourselves via DB after the call.
    const client  = makeClient(cs.PaymentsApi);
    const reqBody = {
      clientReferenceInformation: { code: ref('SAVE') },
      processingInformation: {
        capture:          false,
        actionList:       ['TOKEN_CREATE'],
        actionTokenTypes: ['paymentInstrument', 'instrumentIdentifier'],
      },
      orderInformation: {
        amountDetails: { totalAmount: '0.00', currency: 'USD' },
        billTo: {
          firstName:          billingAddress.firstName || 'Card',
          lastName:           billingAddress.lastName  || 'Owner',
          address1:           billingAddress.address1  || '1 Main St',
          locality:           billingAddress.city      || 'San Francisco',
          administrativeArea: billingAddress.state     || 'CA',
          postalCode:         billingAddress.postalCode|| '94105',
          country:            billingAddress.country   || 'US',
          email:              userEmail || billingAddress.email || 'noreply@flapapay.com',
          phoneNumber:        billingAddress.phone     || '5555555555',
        },
      },
      // Flex Microform v2 JWT goes in tokenInformation.transientTokenJwt —
      // this is the designated SDK field; fluidData and tokenizedCard are wrong.
      tokenInformation: { transientTokenJwt: transientToken },
    };

    require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
      `[linkCard-req] customerId=${customerId} tokenLen=${transientToken.length}\n`);
    require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
      `[linkCard-tokenInfo] transientTokenJwt prefix=${transientToken.slice(0, 60)}\n`);

    const data = await wrap(cb => client.createPayment(reqBody, cb));

    require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
      `[linkCard-auth-resp] status=${data.status} id=${data.id} tokenInfo=${JSON.stringify(data.tokenInformation || {})}\n`);

    const instrId = data.tokenInformation?.paymentInstrument?.id;
    const identId = data.tokenInformation?.instrumentIdentifier?.id;

    // Void the $0 auth immediately — we only needed it to tokenize
    if (data.id && data.status === 'AUTHORIZED') {
      try {
        const voidClient = makeClient(cs.VoidApi);
        await wrap(cb => voidClient.voidPayment(new cs.VoidPaymentRequest(), data.id, cb));
        require('fs').appendFileSync('C:\\FlapaPay\\debug.log', `[linkCard-void-ok] paymentId=${data.id}\n`);
      } catch (e) {
        require('fs').appendFileSync('C:\\FlapaPay\\debug.log', `[linkCard-void-err] ${e.message}\n`);
      }
    }

    if (!instrId) throw new Error('No paymentInstrument id in auth response: ' + JSON.stringify(data.tokenInformation));

    require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
      `[linkCard-ok] instrumentId=${instrId} identifierId=${identId}\n`);

    return { instrumentId: instrId, identifierId: identId, last4, brand, expirationMonth, expirationYear };
  },

  // List all cards linked to a customer
  async listCards(customerId) {
    const client = makeClient(cs.CustomerPaymentInstrumentApi);
    const data   = await wrap(cb => client.getCustomerPaymentInstrumentsList(customerId, cb));
    const items  = data._embedded?.paymentInstruments || [];
    return items.map(inst => ({
      instrumentId:    inst.id,
      last4:           inst.card?.suffix,
      brand:           inst.card?.type,
      expirationMonth: inst.card?.expirationMonth,
      expirationYear:  inst.card?.expirationYear,
    }));
  },

  // Delete a payment instrument (unlink card)
  async deleteCard(customerId, instrumentId) {
    const client = makeClient(cs.CustomerPaymentInstrumentApi);
    await wrap(cb => client.deleteCustomerPaymentInstrument(customerId, instrumentId, {}, cb));
    console.log(`[CyberSource] Deleted instrument ${instrumentId} from customer ${customerId}`);
    return { deleted: true };
  },
};

// =============================================================================
// 3. FLEX MICROFORM — Capture context for secure card input in the browser
//    Frontend: new Flex(captureContext) → microform.createToken()
// =============================================================================
const flex = {

  // Generate a capture context JWT — expires in 15 minutes
  async getCaptureContext(targetOrigin) {
    const client = makeClient(cs.MicroformIntegrationApi);
    const req    = new cs.GenerateFlexAPICaptureContextRequest();

    req.clientVersion  = 'v2';
    req.targetOrigins  = [targetOrigin || process.env.CYBERSOURCE_FLEX_TARGET_ORIGIN || 'http://localhost:5173'];
    req.allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'MAESTRO'];

    const data = await wrap(cb => client.generateCaptureContext(req, cb));
    // Returns a JWT string directly
    const token = typeof data === 'string' ? data : JSON.stringify(data);
    console.log(`[CyberSource] Flex capture context generated (${token.length} chars)`);
    return token;
  },
};

// =============================================================================
// 4. DECISION MANAGER — Bundled fraud risk evaluation
// =============================================================================
const risk = {

  async evaluate({
    chargeId, amount, currency,
    userId, email, ipAddress,
    deviceFingerprint, userAgent,
    last4, cardBrand,
    merchantType = 'direct', kycLevel = 0, accountAgeDays = 0,
  }) {
    const client = makeClient(cs.DecisionManagerApi);
    const req    = new cs.CreateBundledDecisionManagerCaseRequest();

    const clientRef = new cs.Riskv1decisionsClientReferenceInformation();
    clientRef.code  = `FLAPA-DM-${chargeId}`;
    req.clientReferenceInformation = clientRef;

    const orderInfo     = new cs.Riskv1decisionsOrderInformation();
    const amountDetails = new cs.Riskv1decisionsOrderInformationAmountDetails();
    amountDetails.totalAmount = String(parseFloat(amount).toFixed(2));
    amountDetails.currency    = currency.toUpperCase();
    orderInfo.amountDetails   = amountDetails;
    req.orderInformation      = orderInfo;

    const buyerInfo              = new cs.Riskv1decisionsBuyerInformation();
    buyerInfo.merchantCustomerID = String(userId);
    buyerInfo.email              = email;
    req.buyerInformation         = buyerInfo;

    if (deviceFingerprint || ipAddress) {
      const deviceInfo = new cs.Riskv1decisionsDeviceInformation();
      if (deviceFingerprint) deviceInfo.fingerprintSessionId = deviceFingerprint;
      if (ipAddress)         deviceInfo.ipAddress            = ipAddress;
      if (userAgent)         deviceInfo.userAgent            = userAgent;
      req.deviceInformation = deviceInfo;
    }

    if (last4 || cardBrand) {
      const paymentInfo = new cs.Riskv1decisionsPaymentInformation();
      const card        = new cs.Riskv1decisionsPaymentInformationCard();
      if (last4)     card.accountSuffix = last4;
      if (cardBrand) card.type          = cardBrand;
      paymentInfo.card       = card;
      req.paymentInformation = paymentInfo;
    }

    // FlapaPay-specific signals passed as merchant-defined fields
    req.merchantDefinedInformation = [
      { key: 'field1', value: merchantType },
      { key: 'field2', value: String(kycLevel) },
      { key: 'field3', value: String(accountAgeDays) },
    ];

    const data     = await wrap(cb => client.createBundledDecisionManagerCase(req, cb));
    const decision = data.riskInformation?.rules?.[0]?.decision || data.status || 'UNKNOWN';
    const score    = data.riskInformation?.score?.result;
    console.log(`[CyberSource] DM ${chargeId}: ${decision} (score: ${score})`);
    return {
      decision,            // ACCEPT | REJECT | REVIEW
      score,
      caseId:  data.id,
      reasons: (data.riskInformation?.rules || []).map(r => r.name),
      raw:     data,
    };
  },
};

// =============================================================================
// 5. BIN LOOKUP — Card intelligence (type, country, 3DS support)
// =============================================================================
const binLookup = {

  async lookup(transientToken) {
    const client = makeClient(cs.BinLookupApi);
    const req    = new cs.CreateBinLookupRequest();

    const clientRef = new cs.Binv1binlookupClientReferenceInformation();
    clientRef.code  = ref('BIN');
    req.clientReferenceInformation = clientRef;

    const tokenInfo              = new cs.Binv1binlookupTokenInformation();
    tokenInfo.transientToken     = transientToken;
    req.tokenInformation         = tokenInfo;

    const data = await wrap(cb => client.getAccountInfo(req, cb));
    return {
      cardType:       data.paymentAccountInformation?.card?.type,
      cardCategory:   data.paymentAccountInformation?.card?.cardType,   // CREDIT | DEBIT | PREPAID
      issuingCountry: data.issuerInformation?.country,
      issuingBank:    data.issuerInformation?.name,
      localCurrency:  data.issuerInformation?.localCurrency,
      supports3DS:    data.consumerAuthenticationInformation?.cardEnrolled === 'Y',
    };
  },
};

// =============================================================================
// 6. PAYOUTS — VisaOCT direct-to-card (merchant settlements, escrow releases)
// =============================================================================
const payouts = {

  async sendToCard({ amount, currency, recipientCustomerId, businessApplicationId = 'PP' }) {
    const client = makeClient(cs.PayoutsApi);
    const req    = new cs.OctCreatePaymentRequest();

    const clientRef = new cs.Ptsv2payoutsClientReferenceInformation();
    clientRef.code  = ref('OCT');
    req.clientReferenceInformation = clientRef;

    const senderInfo           = new cs.Ptsv2payoutsSenderInformation();
    senderInfo.referenceNumber = clientRef.code;
    const senderAccount        = new cs.Ptsv2payoutsSenderInformationAccount();
    senderAccount.fundsSource  = 'Corp';
    senderInfo.account         = senderAccount;
    req.senderInformation      = senderInfo;

    const recipientInfo                   = new cs.Ptsv2payoutsRecipientInformation();
    const recipientPayment                = new cs.Ptsv2payoutsRecipientInformationPaymentInformation();
    const recipientCustomer               = new cs.Ptsv2payoutsRecipientInformationPaymentInformationCustomer();
    recipientCustomer.customerId          = recipientCustomerId;
    recipientPayment.customer             = recipientCustomer;
    recipientInfo.paymentInformation      = recipientPayment;
    req.recipientInformation              = recipientInfo;

    const orderInfo     = new cs.Ptsv2payoutsOrderInformation();
    const amountDetails = new cs.Ptsv2payoutsOrderInformationAmountDetails();
    amountDetails.totalAmount = String(parseFloat(amount).toFixed(2));
    amountDetails.currency    = currency.toUpperCase();
    orderInfo.amountDetails   = amountDetails;
    req.orderInformation      = orderInfo;

    const processingInfo = new cs.Ptsv2payoutsProcessingInformation();
    processingInfo.businessApplicationId = businessApplicationId; // PP | FD | WT
    req.processingInformation = processingInfo;

    const data = await wrap(cb => client.octCreatePayment(req, cb));
    console.log(`[CyberSource] OCT payout ${amount} ${currency} → ${recipientCustomerId} (${data.status})`);
    return { id: data.id, status: data.status, raw: data };
  },
};

// =============================================================================
// 7. WEBHOOK HANDLER — Express middleware for POST /webhooks/cybersource
// =============================================================================
const webhooks = {

  handler(req, res, next) {
    const crypto = require('crypto');

    // Production: verify HMAC-SHA256 signature
    if (process.env.NODE_ENV === 'production' && process.env.CYBERSOURCE_WEBHOOK_SECRET) {
      const sig = req.headers['v-c-signature'] || req.headers['x-cybersource-signature'];
      if (!sig) return res.status(401).json({ error: 'Missing webhook signature' });

      const computed = crypto
        .createHmac('sha256', process.env.CYBERSOURCE_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig))) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    // Sandbox: No Auth — skip verification

    const event = req.body;
    console.log(`[CyberSource Webhook] ${event.eventType || event.type} | id: ${event.id}`);
    req.cybersourceEvent = event;
    next();
  },
};

// =============================================================================
// 8. HEALTH CHECK — verify credentials against sandbox
// =============================================================================
async function healthCheck() {
  try {
    const captureContext = await flex.getCaptureContext();
    return {
      ok:          true,
      flex:        !!captureContext,
      merchantId:  configObject.merchantID,
      environment: configObject.runEnvironment,
    };
  } catch (err) {
    return {
      ok:          false,
      error:       err.message,
      merchantId:  configObject.merchantID,
      environment: configObject.runEnvironment,
    };
  }
}

module.exports = {
  payments,
  tokens,
  flex,
  risk,
  binLookup,
  payouts,
  webhooks,
  healthCheck,
  configObject,
};
