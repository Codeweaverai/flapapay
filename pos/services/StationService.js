const { PosError } = require('../utils/errors');
const { createPrefixedReference } = require('../utils/references');

class StationService {
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

    async listStations({ userId }) {
        const merchantId = await this.getMerchantId(userId);
        const result = await this.pool.query(
            `SELECT id, code, name, city, address_line_1, address_line_2, timezone, status, created_at
             FROM stations
             WHERE merchant_id = $1
             ORDER BY created_at DESC`,
            [merchantId]
        );
        return { stations: result.rows };
    }

    async createStation({ userId, code, name, city, addressLine1, addressLine2, timezone = 'Africa/Lusaka' }) {
        if (!name) {
            throw new PosError('VALIDATION_ERROR', 'Station name is required.', 400);
        }

        const merchantId = await this.getMerchantId(userId);
        const normalizedCode = String(code || '').trim().toUpperCase() || createPrefixedReference('STN', 4);

        try {
            const result = await this.pool.query(
                `INSERT INTO stations
                    (merchant_id, code, name, city, address_line_1, address_line_2, timezone, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
                 RETURNING id, code, name, city, address_line_1, address_line_2, timezone, status, created_at`,
                [merchantId, normalizedCode, name, city || null, addressLine1 || null, addressLine2 || null, timezone]
            );
            return { station: result.rows[0] };
        } catch (err) {
            if (err.code === '23505') {
                throw new PosError('STATION_CODE_EXISTS', 'A station with this code already exists.', 409);
            }
            throw err;
        }
    }

    async listPumps({ userId }) {
        const merchantId = await this.getMerchantId(userId);
        const result = await this.pool.query(
            `SELECT p.id,
                    p.station_id,
                    p.code,
                    p.label,
                    p.fuel_grade,
                    p.status,
                    p.created_at,
                    s.name AS station_name
             FROM station_pumps p
             INNER JOIN stations s ON s.id = p.station_id
             WHERE s.merchant_id = $1
             ORDER BY s.name ASC, p.code ASC`,
            [merchantId]
        );
        return { pumps: result.rows };
    }

    async createPump({ userId, stationId, code, label, fuelGrade }) {
        if (!stationId || !code) {
            throw new PosError('VALIDATION_ERROR', 'stationId and pump code are required.', 400);
        }

        const merchantId = await this.getMerchantId(userId);
        const stationRes = await this.pool.query(
            'SELECT id, merchant_id, status FROM stations WHERE id = $1',
            [stationId]
        );

        if (stationRes.rows.length === 0) {
            throw new PosError('STATION_NOT_FOUND', 'Station not found.', 404);
        }
        if (stationRes.rows[0].merchant_id !== merchantId) {
            throw new PosError('STATION_ACCESS_DENIED', 'The selected station does not belong to this merchant.', 403);
        }
        if (String(stationRes.rows[0].status).toUpperCase() !== 'ACTIVE') {
            throw new PosError('STATION_NOT_ACTIVE', 'The selected station is not active.', 409);
        }

        try {
            const result = await this.pool.query(
                `INSERT INTO station_pumps
                    (station_id, code, label, fuel_grade, status)
                 VALUES ($1, $2, $3, $4, 'ACTIVE')
                 RETURNING id, station_id, code, label, fuel_grade, status, created_at`,
                [stationId, String(code).trim().toUpperCase(), label || null, fuelGrade || null]
            );
            return { pump: result.rows[0] };
        } catch (err) {
            if (err.code === '23505') {
                throw new PosError('PUMP_CODE_EXISTS', 'A pump with this code already exists at the station.', 409);
            }
            throw err;
        }
    }

    async updatePumpStatus({ userId, pumpId, status }) {
        const normalizedStatus = String(status || '').trim().toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(normalizedStatus)) {
            throw new PosError('VALIDATION_ERROR', 'Pump status must be ACTIVE or SUSPENDED.', 400);
        }

        const merchantId = await this.getMerchantId(userId);
        const result = await this.pool.query(
            `UPDATE station_pumps p
             SET status = $3,
                 updated_at = NOW()
             FROM stations s
             WHERE p.id = $1
               AND p.station_id = s.id
               AND s.merchant_id = $2
             RETURNING p.id, p.station_id, p.code, p.label, p.fuel_grade, p.status, p.created_at`,
            [pumpId, merchantId, normalizedStatus]
        );

        if (result.rows.length === 0) {
            throw new PosError('PUMP_NOT_FOUND', 'Pump not found for this merchant.', 404);
        }

        return { pump: result.rows[0] };
    }
}

module.exports = StationService;
