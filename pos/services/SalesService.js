const { PosError } = require('../utils/errors');
const { createPrefixedReference } = require('../utils/references');

class SalesService {
    constructor({ pool }) {
        this.pool = pool;
    }

    async getMerchantId(userId) {
        const merchantRes = await this.pool.query('SELECT id FROM merchants WHERE user_id = $1', [userId]);
        if (merchantRes.rows.length === 0) {
            throw new PosError('MERCHANT_NOT_FOUND', 'Merchant not found for this user.', 404);
        }
        return merchantRes.rows[0].id;
    }

    async listSales({ userId, limit = 20, status }) {
        const merchantId = await this.getMerchantId(userId);
        const parsedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
        const normalizedStatus = status ? String(status).trim().toUpperCase() : null;

        const params = [merchantId, parsedLimit];
        let statusClause = '';
        if (normalizedStatus) {
            params.push(normalizedStatus);
            statusClause = 'AND ps.status = $3';
        }

        const result = await this.pool.query(
            `SELECT ps.id,
                    ps.station_id,
                    ps.device_id,
                    ps.operator_id,
                    ps.shift_id,
                    ps.pump_id,
                    ps.sale_reference,
                    ps.customer_reference,
                    ps.fuel_grade,
                    ps.litres,
                    ps.price_per_litre,
                    ps.amount,
                    ps.currency,
                    ps.status,
                    ps.payment_status,
                    ps.payment_method,
                    ps.receipt_printed,
                    ps.voided_at,
                    ps.void_reason,
                    ps.paid_at,
                    ps.created_at,
                    s.name AS station_name,
                    d.label AS device_label,
                    o.full_name AS operator_name,
                    o.employee_number,
                    p.code AS pump_code,
                    p.label AS pump_label
             FROM pos_sales ps
             INNER JOIN stations s ON s.id = ps.station_id
             INNER JOIN pos_devices d ON d.id = ps.device_id
             INNER JOIN station_operators o ON o.id = ps.operator_id
             LEFT JOIN station_pumps p ON p.id = ps.pump_id
             WHERE ps.merchant_id = $1
               ${statusClause}
             ORDER BY ps.created_at DESC
             LIMIT $2`,
            params
        );

        return { sales: result.rows };
    }

    async createSale({ operator, pumpId, customerReference, fuelGrade, litres, pricePerLitre, amount, currency = 'ZMW' }) {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new PosError('VALIDATION_ERROR', 'A valid positive amount is required.', 400);
        }

        const numericLitres = litres == null || litres === '' ? null : Number(litres);
        const numericPricePerLitre = pricePerLitre == null || pricePerLitre === '' ? null : Number(pricePerLitre);

        if (numericLitres != null && (!Number.isFinite(numericLitres) || numericLitres <= 0)) {
            throw new PosError('VALIDATION_ERROR', 'Litres must be a positive number when provided.', 400);
        }
        if (numericPricePerLitre != null && (!Number.isFinite(numericPricePerLitre) || numericPricePerLitre <= 0)) {
            throw new PosError('VALIDATION_ERROR', 'pricePerLitre must be a positive number when provided.', 400);
        }

        const shiftRes = await this.pool.query(
            `SELECT id
             FROM operator_shifts
             WHERE operator_id = $1
               AND device_id = $2
               AND status = 'OPEN'
             LIMIT 1`,
            [operator.id, operator.device_id]
        );

        if (shiftRes.rows.length === 0) {
            throw new PosError('SHIFT_NOT_OPEN', 'An open shift is required before creating sales.', 409);
        }

        let pump = null;
        if (pumpId) {
            const pumpRes = await this.pool.query(
                `SELECT id, code, label, fuel_grade, status
                 FROM station_pumps
                 WHERE id = $1
                   AND station_id = $2`,
                [pumpId, operator.station_id]
            );

            if (pumpRes.rows.length === 0) {
                throw new PosError('PUMP_NOT_FOUND', 'The selected pump was not found for this station.', 404);
            }
            if (String(pumpRes.rows[0].status).toUpperCase() !== 'ACTIVE') {
                throw new PosError('PUMP_NOT_ACTIVE', 'The selected pump is not active.', 409);
            }
            pump = pumpRes.rows[0];
        }

        const normalizedCurrency = String(currency || 'ZMW').trim().toUpperCase();
        const saleReference = createPrefixedReference('FPSALE', 5);
        const normalizedFuelGrade = fuelGrade || pump?.fuel_grade || null;

        const result = await this.pool.query(
            `INSERT INTO pos_sales
                (merchant_id, station_id, device_id, operator_id, shift_id, pump_id, sale_reference, customer_reference,
                 fuel_grade, litres, price_per_litre, amount, currency, status, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'AWAITING_PAYMENT', 'UNPAID')
             RETURNING id, sale_reference, station_id, device_id, operator_id, shift_id, pump_id, customer_reference,
                       fuel_grade, litres, price_per_litre, amount, currency, status, payment_status, created_at`,
            [
                operator.merchant_id,
                operator.station_id,
                operator.device_id,
                operator.id,
                shiftRes.rows[0].id,
                pump?.id || null,
                saleReference,
                customerReference || null,
                normalizedFuelGrade,
                numericLitres,
                numericPricePerLitre,
                numericAmount,
                normalizedCurrency,
            ]
        );

        return { sale: result.rows[0] };
    }

    async listCurrentShiftSales({ operator, limit = 20 }) {
        const parsedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
        const shiftRes = await this.pool.query(
            `SELECT id
             FROM operator_shifts
             WHERE operator_id = $1
               AND device_id = $2
               AND status = 'OPEN'
             LIMIT 1`,
            [operator.id, operator.device_id]
        );

        if (shiftRes.rows.length === 0) {
            return { sales: [] };
        }

        const result = await this.pool.query(
            `SELECT id, sale_reference, pump_id, customer_reference, fuel_grade, litres, price_per_litre, amount, currency,
                    status, payment_status, payment_method, paid_at, created_at
             FROM pos_sales
             WHERE shift_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [shiftRes.rows[0].id, parsedLimit]
        );

        return { sales: result.rows };
    }

    async voidSale({ operator, saleId, reason }) {
        if (!reason) {
            throw new PosError('VALIDATION_ERROR', 'A void reason is required.', 400);
        }

        const saleRes = await this.pool.query(
            `SELECT id, status, payment_status
             FROM pos_sales
             WHERE id = $1
               AND merchant_id = $2
               AND station_id = $3`,
            [saleId, operator.merchant_id, operator.station_id]
        );

        if (saleRes.rows.length === 0) {
            throw new PosError('SALE_NOT_FOUND', 'Sale not found for this operator.', 404);
        }

        const sale = saleRes.rows[0];
        if (String(sale.status).toUpperCase() === 'PAID' || String(sale.payment_status).toUpperCase() === 'PAID') {
            throw new PosError('SALE_ALREADY_PAID', 'Paid sales cannot be voided.', 409);
        }
        if (String(sale.status).toUpperCase() === 'VOIDED') {
            throw new PosError('SALE_ALREADY_VOIDED', 'This sale has already been voided.', 409);
        }

        const result = await this.pool.query(
            `UPDATE pos_sales
             SET status = 'VOIDED',
                 payment_status = 'VOIDED',
                 voided_at = NOW(),
                 void_reason = $2,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, sale_reference, status, payment_status, voided_at, void_reason`,
            [saleId, reason]
        );

        return { sale: result.rows[0] };
    }
}

module.exports = SalesService;
