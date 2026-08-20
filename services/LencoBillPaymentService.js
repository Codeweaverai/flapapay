const axios = require('axios');
const crypto = require('crypto');

const LENCO_TOKEN = process.env.LENCO_SECRET_KEY || '';
const LENCO_BILLS_BASE_URL = process.env.LENCO_BILL_BASE_URL || 'https://api.lenco.co/access/v1';

const request = async (method, path, { params, data } = {}) => {
    if (!LENCO_TOKEN) {
        throw new Error('LENCO_SECRET_KEY is not configured');
    }

    const res = await axios({
        method,
        url: `${LENCO_BILLS_BASE_URL}${path}`,
        params,
        data,
        headers: {
            Authorization: `Bearer ${LENCO_TOKEN}`,
            'Content-Type': 'application/json'
        },
        timeout: 20000
    });

    return res.data;
};

const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.items)) return value.items;
    return [];
};

const toAmountRule = (payload = {}) => {
    const amountNode = payload.amount || payload.pricing || {};
    const amountType = payload.amountType || amountNode.type || (payload.fixedAmount ? 'fixed' : 'range') || null;
    const fixedAmount = Number(
        payload.fixedAmount ??
        amountNode.fixed ??
        amountNode.fixedAmount ??
        amountNode.amount ??
        0
    );
    const minimumAmount = Number(
        payload.minimumAmount ??
        payload.minAmount ??
        amountNode.min ??
        amountNode.minimum ??
        amountNode.minimumAmount ??
        0
    );
    const maximumAmount = Number(
        payload.maximumAmount ??
        payload.maxAmount ??
        amountNode.max ??
        amountNode.maximum ??
        amountNode.maximumAmount ??
        0
    );

    return {
        amountType: amountType || (fixedAmount > 0 ? 'fixed' : 'range'),
        fixedAmount: Number.isFinite(fixedAmount) ? fixedAmount : 0,
        minimumAmount: Number.isFinite(minimumAmount) ? minimumAmount : 0,
        maximumAmount: Number.isFinite(maximumAmount) ? maximumAmount : 0
    };
};

const normalizeVendor = (vendor = {}, fallbackCategory = null) => ({
    providerVendorId: String(vendor.id || vendor.vendorId || vendor._id || ''),
    categoryCode: String(vendor.category || vendor.categoryCode || fallbackCategory || '').trim().toLowerCase(),
    name: String(vendor.name || vendor.vendorName || vendor.title || '').trim(),
    rawPayload: vendor
});

const normalizeProduct = (product = {}, fallbackCategory = null, fallbackVendorId = null) => {
    const amountRule = toAmountRule(product);
    return {
        providerProductId: String(product.id || product.productId || product._id || ''),
        providerVendorId: String(product.vendorId || product.vendor?.id || fallbackVendorId || ''),
        categoryCode: String(product.category || product.categoryCode || fallbackCategory || '').trim().toLowerCase(),
        name: String(product.name || product.productName || product.title || '').trim(),
        customerIdLabel: String(product.customerIdLabel || product.customerLabel || product.identifierLabel || 'Customer ID').trim(),
        amountType: amountRule.amountType,
        fixedAmount: amountRule.fixedAmount,
        minimumAmount: amountRule.minimumAmount,
        maximumAmount: amountRule.maximumAmount,
        commissionPercentage: Number(product.commission || product.commissionPercentage || product.commissionRate || 0) || 0,
        rawPayload: product
    };
};

const normalizeLookup = (payload = {}) => {
    const root = payload?.data || payload;
    const customer = root?.customer || {};
    const explicitVerified = root?.verified ?? root?.isValid ?? root?.success;
    const status = String(root?.status || '').trim().toLowerCase();
    return {
        verified: explicitVerified != null ? Boolean(explicitVerified) : ['successful', 'success', 'verified', 'valid'].includes(status),
        customerName: String(
            root?.customerName ||
            customer?.name ||
            customer?.fullName ||
            root?.name ||
            ''
        ).trim() || null,
        accountNumber: String(root?.accountNumber || root?.customerId || '').trim() || null,
        message: String(root?.message || root?.description || '').trim() || null,
        rawPayload: payload
    };
};

const normalizeBillPayment = (payload = {}) => {
    const root = payload?.data || payload;
    return {
        providerBillPaymentId: String(root?.id || root?.billId || root?.paymentId || ''),
        providerReference: String(root?.reference || root?.transactionReference || root?.providerReference || ''),
        providerStatus: String(root?.status || root?.state || 'pending').trim().toLowerCase(),
        customerName: String(root?.customerName || root?.customer?.name || '').trim() || null,
        amount: Number(root?.amount || root?.amountPaid || root?.value || 0) || 0,
        instructions: root?.instructions || null,
        rawPayload: payload
    };
};

class LencoBillPaymentService {
    categories() {
        return [
            { code: 'airtime', displayName: 'Airtime' },
            { code: 'mobile-data', displayName: 'Mobile Data' },
            { code: 'cable-tv', displayName: 'Cable TV' },
            { code: 'electricity', displayName: 'Electricity' }
        ];
    }

    async listVendors() {
        const data = await request('get', '/bills/vendors');
        return asArray(data).map((vendor) => normalizeVendor(vendor));
    }

    async listVendorsByCategory(categoryCode) {
        const data = await request('get', `/bills/vendors/by-category/${encodeURIComponent(categoryCode)}`);
        return asArray(data).map((vendor) => normalizeVendor(vendor, categoryCode));
    }

    async getVendor(vendorId) {
        const data = await request('get', `/bills/vendors/${encodeURIComponent(vendorId)}`);
        return normalizeVendor(data?.data || data);
    }

    async listProducts() {
        const data = await request('get', '/bills/products');
        return asArray(data).map((product) => normalizeProduct(product));
    }

    async listProductsByCategory(categoryCode) {
        const data = await request('get', `/bills/products/by-category/${encodeURIComponent(categoryCode)}`);
        return asArray(data).map((product) => normalizeProduct(product, categoryCode));
    }

    async listProductsByVendor(vendorId) {
        const data = await request('get', `/bills/products/by-vendor/${encodeURIComponent(vendorId)}`);
        return asArray(data).map((product) => normalizeProduct(product, null, vendorId));
    }

    async getProduct(productId) {
        const data = await request('get', `/bills/products/${encodeURIComponent(productId)}`);
        return normalizeProduct(data?.data || data);
    }

    async lookupAccount({ customerId, vendorId, productId }) {
        const params = { customerId };
        if (productId) params.productId = productId;
        if (vendorId) params.vendorId = vendorId;
        const data = await request('get', '/bills/lookup-account', { params });
        return normalizeLookup(data);
    }

    async createBill({ productId, customerId, debitAccountId, amount, reference }) {
        const payload = { productId, customerId, debitAccountId };
        if (amount != null) payload.amount = Number(amount);
        if (reference) payload.reference = reference;
        const data = await request('post', '/bills', { data: payload });
        return normalizeBillPayment(data);
    }

    async getBill(id) {
        const data = await request('get', `/bills/${encodeURIComponent(id)}`);
        return normalizeBillPayment(data);
    }

    async getBillByReference(reference) {
        const data = await request('get', `/bills/by-reference/${encodeURIComponent(reference)}`);
        return normalizeBillPayment(data);
    }

    async listBills(params = {}) {
        const data = await request('get', '/bills', { params });
        return asArray(data).map((row) => normalizeBillPayment(row));
    }

    verifyWebhookSignature(rawBody, signatureHeader) {
        const signature = String(signatureHeader || '').trim();
        if (!LENCO_TOKEN || !rawBody || !signature) return false;
        const hashedToken = crypto.createHash('sha256').update(LENCO_TOKEN).digest('hex');
        const expected = crypto.createHmac('sha512', hashedToken).update(rawBody).digest('hex');
        if (signature.length !== expected.length) return false;
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
}

module.exports = new LencoBillPaymentService();
