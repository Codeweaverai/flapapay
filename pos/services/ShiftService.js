const { PosError } = require('../utils/errors');

class ShiftService {
    constructor({ pool }) {
        this.pool = pool;
    }

    async listShifts({ userId, limit = 20 }) {
        const merchantRes = await this.pool.query('SELECT id FROM merchants WHERE user_id = $1', [userId]);
        if (merchantRes.rows.length === 0) {
            throw new PosError('MERCHANT_NOT_FOUND', 'Merchant not found for this user.', 404);
        }

        const parsedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
        const result = await this.pool.query(
            `SELECT os.id,
                    os.station_id,
                    os.operator_id,
                    os.device_id,
                    os.opened_at,
                    os.closed_at,
                    os.status,
                    os.opening_note,
                    os.closing_note,
                    os.opening_cash_amount,
                    os.closing_cash_amount,
                    os.sales_count,
                    os.gross_amount,
                    os.currency,
                    s.name AS station_name,
                    so.full_name AS operator_name,
                    so.employee_number,
                    d.label AS device_label,
                    d.device_code
             FROM operator_shifts os
             INNER JOIN stations s ON s.id = os.station_id
             INNER JOIN station_operators so ON so.id = os.operator_id
             INNER JOIN pos_devices d ON d.id = os.device_id
             WHERE os.merchant_id = $1
             ORDER BY
                CASE WHEN os.status = 'OPEN' THEN 0 ELSE 1 END,
                os.opened_at DESC
             LIMIT $2`,
            [merchantRes.rows[0].id, parsedLimit]
        );

        return {
            shifts: result.rows,
        };
    }

    async openShift({ operator, openingNote, openingCashAmount }) {
        const existing = await this.pool.query(
            `SELECT id, opened_at, status
             FROM operator_shifts
             WHERE operator_id = $1
               AND device_id = $2
               AND status = 'OPEN'
             LIMIT 1`,
            [operator.id, operator.device_id]
        );

        if (existing.rows.length > 0) {
            throw new PosError('SHIFT_ALREADY_OPEN', 'An open shift already exists for this operator and device.', 409);
        }

        const result = await this.pool.query(
            `INSERT INTO operator_shifts
                (merchant_id, station_id, operator_id, device_id, opening_note, opening_cash_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'OPEN')
             RETURNING id, station_id, operator_id, device_id, opened_at, status, opening_note, opening_cash_amount`,
            [operator.merchant_id, operator.station_id, operator.id, operator.device_id, openingNote || null, openingCashAmount ?? null]
        );

        return { shift: result.rows[0] };
    }

    async closeShift({ operator, closingNote, closingCashAmount }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const openShiftRes = await client.query(
                `SELECT id, opened_at
                 FROM operator_shifts
                 WHERE operator_id = $1
                   AND device_id = $2
                   AND status = 'OPEN'
                 LIMIT 1
                 FOR UPDATE`,
                [operator.id, operator.device_id]
            );

            if (openShiftRes.rows.length === 0) {
                throw new PosError('SHIFT_NOT_OPEN', 'No open shift found for this operator and device.', 409);
            }

            const shift = openShiftRes.rows[0];
            const totalsRes = await client.query(
                `SELECT COUNT(*)::int AS sales_count,
                        COALESCE(SUM(amount), 0)::numeric(18,2) AS gross_amount
                 FROM pos_sales
                 WHERE shift_id = $1
                   AND status = 'PAID'`,
                [shift.id]
            );

            const totals = totalsRes.rows[0];
            const updatedRes = await client.query(
                `UPDATE operator_shifts
                 SET status = 'CLOSED',
                     closed_at = NOW(),
                     closing_note = $2,
                     closing_cash_amount = $3,
                     sales_count = $4,
                     gross_amount = $5,
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING id, station_id, operator_id, device_id, opened_at, closed_at, status, sales_count, gross_amount, currency`,
                [shift.id, closingNote || null, closingCashAmount ?? null, totals.sales_count, totals.gross_amount]
            );

            await client.query('COMMIT');
            return {
                shift: updatedRes.rows[0],
                summary: {
                    sales_count: updatedRes.rows[0].sales_count,
                    gross_amount: updatedRes.rows[0].gross_amount,
                    currency: updatedRes.rows[0].currency,
                }
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = ShiftService;
