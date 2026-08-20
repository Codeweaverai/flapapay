require('dotenv').config();
const cs = require('cybersource-rest-client');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

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

function sanitizeReferenceCode(value, maxLength = 30) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, maxLength);
}

function tokenFingerprint(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex').slice(0, 16);
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
              respText: error?.response?.text,
              msg:      error?.message,
            };
            require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
              '[CS-ERR] ' + JSON.stringify(diag) + '\n');
          } catch(e) {}

          const body = error?.response?.text || error?.response?.body || error?.message;
          const msg  = typeof body === 'object' ? JSON.stringify(body) : String(body || error);
          const wrapped = new Error(msg);
          wrapped.csStatus = error?.status || error?.response?.status;
          wrapped.csUrl = error?.response?.req?.url;
          wrapped.csBody = body;
          return reject(wrapped);
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
  async authorize({ amount, currency, customerId, instrumentId, transientToken, capture = false, metadata = {}, billTo = null }) {
    const client = makeClient(cs.PaymentsApi);
    if (!instrumentId && !customerId && !transientToken) {
      throw new Error('[CyberSource] authorize: provide instrumentId, customerId, or transientToken');
    }

    const reqBody = {
      clientReferenceInformation: {
        code: metadata.ref || ref('AUTH'),
      },
      orderInformation: {
        amountDetails: {
          totalAmount: String(parseFloat(amount).toFixed(2)),
          currency: currency.toUpperCase(),
        },
      },
      processingInformation: {
        capture,
      },
    };

    if (billTo) {
      reqBody.orderInformation.billTo = billTo;
    }

    if (instrumentId) {
      reqBody.paymentInformation = {
        paymentInstrument: {
          id: instrumentId,
        },
      };
    } else if (customerId) {
      reqBody.paymentInformation = {
        customer: {
          customerId,
        },
      };
    } else {
      // Flex Microform v2 returns a JWT transient token. CyberSource expects
      // that JWT under tokenInformation.transientTokenJwt for payment auth/sale.
      reqBody.tokenInformation = {
        transientTokenJwt: transientToken,
      };
    }

    const data = await wrap(cb => client.createPayment(reqBody, cb));
    console.log(`[CyberSource] Auth ${amount} ${currency} → ${data.id} (${data.status})`);
    return {
      id:       data.id,
      status:   data.status,                                   // AUTHORIZED | DECLINED
      authCode: data.processorInformation?.approvalCode,
      transactionId: data.processorInformation?.transactionId,
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
    clientRef.code  = sanitizeReferenceCode(`FLAPAUSER${String(userId).replace(/-/g, '')}`, 26) || ref('CUS').slice(0, 26);
    req.clientReferenceInformation = clientRef;

    const buyerInfo              = new cs.Tmsv2tokenizeTokenInformationCustomerBuyerInformation();
    buyerInfo.merchantCustomerID = sanitizeReferenceCode(userId, 50) || String(userId).slice(0, 50);
    buyerInfo.email              = email;
    req.buyerInformation = buyerInfo;

    const data = await wrap(cb => client.postCustomer(req, {}, cb));
    console.log(`[CyberSource] Created customer token ${data.id} for user ${userId}`);
    return data.id;
  },

  // Link a card via Flex Microform v2 transient token JWT.
  // Uses /pts/v2/payments with TOKEN_CREATE + customer token, then falls back to
  // creating a customer payment instrument from instrumentIdentifier when needed.
  async linkCard({
    customerId,
    transientToken,
    billingAddress = {},
    userEmail = '',
    expirationMonth: requestedExpirationMonth,
    expirationYear: requestedExpirationYear,
    setDefault = false,
  }) {
    const inferCardTypeFromMasked = (maskedValue = '') => {
      const first = String(maskedValue || '').trim()[0];
      if (first === '4') return '001'; // VISA
      if (first === '5') return '002'; // MASTERCARD
      if (first === '3') return '003'; // AMEX
      if (first === '6') return '004'; // DISCOVER
      return undefined;
    };

    // ── 1. Decode Flex JWT payload → extract card details ──────────────────
    let last4, brand, expirationMonth, expirationYear, cardTypeCode, maskedValue, transientJti;
    try {
      const parts = transientToken.split('.');
      if (parts.length < 2) throw new Error('Not a JWT');
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      b64 += '='.repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      transientJti    = payload?.jti;
      const card = payload?.content?.paymentInformation?.card;
      const detectedCardTypes = Array.isArray(card?.number?.detectedCardTypes)
        ? card.number.detectedCardTypes
        : [];
      maskedValue     = card?.number?.maskedValue;
      last4           = maskedValue?.slice(-4);
      expirationMonth = card?.expirationMonth?.value || requestedExpirationMonth;
      expirationYear  = card?.expirationYear?.value || requestedExpirationYear;
      const typeMap   = { '001': 'VISA', '002': 'MASTERCARD', '003': 'AMEX', '004': 'DISCOVER', '007': 'JCB' };
      const rawType   = String(card?.type?.value || card?.type || detectedCardTypes[0] || '').toUpperCase();
      const brandToCode = {
        VISA: '001',
        MASTERCARD: '002',
        AMEX: '003',
        DISCOVER: '004',
        JCB: '007',
      };
      cardTypeCode = /^\d{3}$/.test(rawType)
        ? rawType
        : (brandToCode[rawType] || inferCardTypeFromMasked(maskedValue));
      brand        = typeMap[cardTypeCode] || rawType || undefined;
      require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
        `[JWT-decoded] last4=${last4} brand=${brand} exp=${expirationMonth}/${expirationYear} cardType=${cardTypeCode || 'NA'} detected=${detectedCardTypes.join(',') || 'NA'} jti=${transientJti || 'NA'}\n`);
    } catch (e) {
      require('fs').appendFileSync('C:\\FlapaPay\\debug.log', `[JWT-decode-err] ${e.message}\n`);
      throw new Error('Invalid Flex token: ' + e.message);
    }

    // Optional enrichment: retrieve non-sensitive payment details from transient token.
    if (!cardTypeCode || !expirationMonth || !expirationYear) {
      try {
        const ttClient = makeClient(cs.TransientTokenDataV2Api);
        const details = await wrap(cb => ttClient.getTransactionForTransientToken(transientToken, cb));
        const read = (obj, path) => path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
        const typeFromDetails =
          read(details, ['paymentInformation', 'card', 'type']) ||
          read(details, ['content', 'paymentInformation', 'card', 'type', 'value']) ||
          read(details, ['card', 'type']);
        const monthFromDetails =
          read(details, ['paymentInformation', 'card', 'expirationMonth']) ||
          read(details, ['content', 'paymentInformation', 'card', 'expirationMonth', 'value']) ||
          read(details, ['card', 'expirationMonth']);
        const yearFromDetails =
          read(details, ['paymentInformation', 'card', 'expirationYear']) ||
          read(details, ['content', 'paymentInformation', 'card', 'expirationYear', 'value']) ||
          read(details, ['card', 'expirationYear']);
        const rawType = String(typeFromDetails || '').toUpperCase();
        if (!cardTypeCode) {
          if (/^\d{3}$/.test(rawType)) cardTypeCode = rawType;
          else if (rawType === 'VISA') cardTypeCode = '001';
          else if (rawType === 'MASTERCARD') cardTypeCode = '002';
          else if (rawType === 'AMEX' || rawType === 'AMERICAN EXPRESS') cardTypeCode = '003';
          else if (rawType === 'DISCOVER') cardTypeCode = '004';
          else if (rawType === 'JCB') cardTypeCode = '007';
        }
        if (!expirationMonth && monthFromDetails) expirationMonth = String(monthFromDetails).padStart(2, '0');
        if (!expirationYear && yearFromDetails) expirationYear = String(yearFromDetails);
        require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
          `[token-details] cardType=${cardTypeCode || 'NA'} exp=${expirationMonth || 'NA'}/${expirationYear || 'NA'}\n`);
      } catch (e) {
        require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
          `[token-details-err] ${e.message}\n`);
      }
    }

    // ── 2. Create instrumentIdentifier via /pts/v2/payments + TOKEN_CREATE ─
    const paymentClient = makeClient(cs.PaymentsApi);
    const billTo = {
      firstName:          billingAddress.firstName || 'Card',
      lastName:           billingAddress.lastName  || 'Owner',
      address1:           billingAddress.address1  || '1 Main St',
      locality:           billingAddress.city      || 'San Francisco',
      administrativeArea: billingAddress.state     || 'CA',
      postalCode:         billingAddress.postalCode|| '94105',
      country:            billingAddress.country   || 'US',
      email:              userEmail || billingAddress.email || 'noreply@flapapay.com',
      phoneNumber:        billingAddress.phone     || '5555555555',
    };

    const shipTo = {
      firstName:          billingAddress.firstName || 'Card',
      lastName:           billingAddress.lastName  || 'Owner',
      address1:           billingAddress.address1  || '1 Main St',
      locality:           billingAddress.city      || 'San Francisco',
      administrativeArea: billingAddress.state     || 'CA',
      postalCode:         billingAddress.postalCode|| '94105',
      country:            billingAddress.country   || 'US',
    };

    // Use zero-amount validation by default so card linking does not place a temporary hold.
    const tokenizeAmount = String(process.env.CYBERSOURCE_TOKENIZE_AUTH_AMOUNT || '0.00');
    const tokenizeCurrency = String(process.env.CYBERSOURCE_TOKENIZE_AUTH_CURRENCY || 'USD').toUpperCase();

    const tokenFp = tokenFingerprint(transientToken);
    const tokenCreateReq = {
      clientReferenceInformation: {
        code: ref('TOKEN'),
      },
      processingInformation: {
        capture: false,
        commerceIndicator: 'internet',
        actionList:       ['TOKEN_CREATE'],
        // For linking into an existing customer token, request a payment instrument token.
        actionTokenTypes: ['paymentInstrument'],
      },
      paymentInformation: {
        customer: {
          id: customerId,
        },
      },
      orderInformation: {
        amountDetails: {
          totalAmount: tokenizeAmount,
          currency: tokenizeCurrency,
        },
        billTo,
        shipTo,
      },
      tokenInformation: {
        transientTokenJwt: transientToken,
        paymentInstrument: {
          default: !!setDefault,
        },
      },
    };

    if (cardTypeCode || expirationMonth || expirationYear) {
      tokenCreateReq.paymentInformation.card = {
        ...(cardTypeCode ? { type: cardTypeCode } : {}),
        ...(expirationMonth ? { expirationMonth } : {}),
        ...(expirationYear ? { expirationYear } : {}),
      };
    }

    require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
      `[linkCard-req] customerId=${customerId} tokenLen=${transientToken.length} tokenFp=${tokenFp} jti=${transientJti || 'NA'} flow=payments_token_create amount=${tokenizeAmount} ${tokenizeCurrency} actionTokenTypes=paymentInstrument\n`);

    const tokenCreateData = await wrap(cb => paymentClient.createPayment(tokenCreateReq, cb));
    const tokenCreateStatus = String(tokenCreateData?.status || '').toUpperCase();
    require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
      `[linkCard-token-create] paymentId=${tokenCreateData?.id || 'NA'} status=${tokenCreateStatus || 'NA'}\n`);

    if (!['AUTHORIZED', 'PENDING', 'ACCEPTED', 'COMPLETED'].includes(tokenCreateStatus)) {
      throw new Error('Token create authorization not approved: ' + (tokenCreateData?.status || 'UNKNOWN'));
    }

    let identId =
      tokenCreateData?.tokenInformation?.instrumentIdentifier?.id ||
      tokenCreateData?.paymentInformation?.instrumentIdentifier?.id ||
      tokenCreateData?.paymentInformation?.paymentInstrument?.instrumentIdentifier?.id;
    let instrId =
      tokenCreateData?.tokenInformation?.paymentInstrument?.id ||
      tokenCreateData?.paymentInformation?.paymentInstrument?.id ||
      tokenCreateData?.paymentInformation?.customer?.paymentInstrument?.id;

    if (!cardTypeCode) {
      const responseCardType = tokenCreateData?.paymentAccountInformation?.card?.type;
      if (responseCardType) cardTypeCode = String(responseCardType).toUpperCase();
    }
    if (!last4) {
      const responseSuffix = tokenCreateData?.paymentAccountInformation?.card?.suffix;
      if (responseSuffix) last4 = String(responseSuffix);
    }

    // Release hold from the token-create authorization attempt.
    if (tokenCreateData?.id && parseFloat(tokenizeAmount) > 0) {
      try {
        await payments.reverse(tokenCreateData.id, tokenizeAmount, tokenizeCurrency);
        require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
          `[linkCard-token-create-reversed] paymentId=${tokenCreateData.id}\n`);
      } catch (reversalErr) {
        require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
          `[linkCard-token-create-reversal-err] paymentId=${tokenCreateData.id} err=${reversalErr.message}\n`);
      }
    }

    // If validated-payment tokenization didn't directly return a customer PI, attach via TMS API.
    if (!instrId && identId) {
      const cpiClient = makeClient(cs.CustomerPaymentInstrumentApi);
      const createPiReq = {
        instrumentIdentifier: { id: identId },
        billTo,
        card: {
          type: cardTypeCode || '001',
          ...(expirationMonth ? { expirationMonth } : {}),
          ...(expirationYear ? { expirationYear } : {}),
        },
      };
      const piData = await wrap(cb => cpiClient.postCustomerPaymentInstrument(customerId, createPiReq, {}, cb));
      instrId = piData?.id;
      identId = identId || piData?.instrumentIdentifier?.id;
      require('fs').appendFileSync('C:\\FlapaPay\\debug.log',
        `[linkCard-create-pi] instrumentId=${instrId || 'NA'} identifierId=${identId || 'NA'} cardType=${createPiReq.card.type}\n`);
    }

    if (!instrId) {
      throw new Error('No paymentInstrument id in tokenization response: ' + JSON.stringify({
        paymentId: tokenCreateData?.id || null,
        status: tokenCreateData?.status || null,
        paymentInformation: tokenCreateData?.paymentInformation || null,
        tokenInformation: tokenCreateData?.tokenInformation || null,
      }));
    }

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
  eventType(event = {}) {
    return event.eventType || event.type || event?.notificationInformation?.eventType || 'unknown';
  },

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
