require('dotenv').config();
const cs = require('cybersource-rest-client');
const { configObject } = require('./CybersourceService');

function makeClient(ApiClass) {
  return new ApiClass(configObject, new cs.ApiClient());
}

function wrap(fn) {
  return new Promise((resolve, reject) => {
    try {
      fn((error, data) => {
        if (error) {
          const body = error?.response?.text || error?.response?.body || error?.message;
          const msg = typeof body === 'object' ? JSON.stringify(body) : String(body || error);
          const wrapped = new Error(msg);
          wrapped.csStatus = error?.status || error?.response?.status;
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

function intervalToBillingPeriod(price = {}) {
  const rawInterval = String(price.billing_interval || price.interval || 'monthly').toLowerCase();
  const intervalCount = String(parseInt(price.interval_count || 1, 10) || 1);
  let unit = 'M';
  if (rawInterval.startsWith('day')) unit = 'D';
  else if (rawInterval.startsWith('week')) unit = 'W';
  else if (rawInterval.startsWith('year')) unit = 'Y';
  return { length: intervalCount, unit };
}

function makePlanCode(priceId) {
  return `FLAPA-PRICE-${String(priceId).slice(0, 8).toUpperCase()}`;
}

function makeSubscriptionCode(subscriptionId) {
  return `SUB-${String(subscriptionId).slice(0, 10).toUpperCase()}`;
}

function sanitizeDisplayText(value, fallback, maxLength) {
  const cleaned = String(value || fallback || '')
    .replace(/[^A-Za-z0-9 /_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || fallback).slice(0, maxLength);
}

const recurring = {
  async ensurePlanForPrice(price, product = {}) {
    if (price.cybersource_plan_id) {
      return { id: price.cybersource_plan_id, reused: true };
    }

    const client = makeClient(cs.PlansApi);
    const request = {
      planInformation: {
        code: makePlanCode(price.id),
        name: sanitizeDisplayText(product.name, `FlapaPay Plan ${String(price.id).slice(0, 8)}`, 60),
        description: sanitizeDisplayText(product.description || product.name, `Price ${price.id}`, 255),
        status: 'ACTIVE',
        billingPeriod: intervalToBillingPeriod(price),
      },
      orderInformation: {
        amountDetails: {
          currency: String(price.currency || 'USD').toUpperCase(),
          billingAmount: String(parseFloat(price.amount || 0).toFixed(2)),
          ...(parseInt(price.trial_days || 0, 10) > 0 ? { setupFee: '0.00' } : {}),
        },
      },
    };

    const data = await wrap(cb => client.createPlan(request, cb));
    return {
      id: data?.id,
      status: data?.status,
      code: data?.planInformation?.code || request.planInformation.code,
      raw: data,
    };
  },

  async createSubscription({
    planId,
    customerId,
    flapaSubscriptionId,
    subscriptionName,
    startDate,
    amount,
    currency,
    originalTransactionId,
    originalTransactionAuthorizedAmount,
  }) {
    const client = makeClient(cs.SubscriptionsApi);
    const request = {
      clientReferenceInformation: {
        code: makeSubscriptionCode(flapaSubscriptionId),
      },
      processingInformation: {
        commerceIndicator: originalTransactionId ? 'RECURRING' : 'INTERNET',
      },
      subscriptionInformation: {
        code: makeSubscriptionCode(flapaSubscriptionId),
        planId,
        name: sanitizeDisplayText(subscriptionName, `FlapaPay Subscription ${String(flapaSubscriptionId).slice(0, 8)}`, 60),
        startDate: new Date(startDate || Date.now()).toISOString(),
        ...(originalTransactionId ? { originalTransactionId } : {}),
        ...(originalTransactionAuthorizedAmount ? {
          originalTransactionAuthorizedAmount: String(parseFloat(originalTransactionAuthorizedAmount).toFixed(2)),
        } : {}),
      },
      paymentInformation: {
        customer: {
          id: customerId,
        },
      },
      orderInformation: {
        amountDetails: {
          currency: String(currency || 'USD').toUpperCase(),
          billingAmount: String(parseFloat(amount || 0).toFixed(2)),
        },
      },
    };

    const data = await wrap(cb => client.createSubscription(request, cb));
    return {
      id: data?.id,
      status: data?.status,
      code: data?.subscriptionInformation?.code || request.subscriptionInformation.code,
      raw: data,
    };
  },

  async cancelSubscription(subscriptionId) {
    const client = makeClient(cs.SubscriptionsApi);
    const data = await wrap(cb => client.cancelSubscription(subscriptionId, cb));
    return { id: subscriptionId, raw: data };
  },

  async suspendSubscription(subscriptionId) {
    const client = makeClient(cs.SubscriptionsApi);
    const data = await wrap(cb => client.suspendSubscription(subscriptionId, cb));
    return { id: subscriptionId, raw: data };
  },

  async activateSubscription(subscriptionId, processMissedPayments = true) {
    const client = makeClient(cs.SubscriptionsApi);
    const data = await wrap(cb => client.activateSubscription(subscriptionId, { processMissedPayments }, cb));
    return { id: subscriptionId, raw: data };
  },

  async getSubscription(subscriptionId) {
    const client = makeClient(cs.SubscriptionsApi);
    const data = await wrap(cb => client.getSubscription(subscriptionId, cb));
    return data;
  },
};

module.exports = recurring;
