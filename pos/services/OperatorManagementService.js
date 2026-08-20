const { PosError } = require('../utils/errors');

class OperatorManagementService {
    constructor({ pool, bcrypt }) {
        this.pool = pool;
        this.bcrypt = bcrypt;
    }

    async getMerchantId(userId) {
        const merchantRes = await this.pool.query('SELECT id FROM merchants WHERE user_id = $1', [userId]);
        if (merchantRes.rows.length === 0) {
            throw new PosError('MERCHANT_NOT_FOUND', 'Merchant not found for this user.', 404);
        }
        return merchantRes.rows[0].id;
    }

    async ensureStationBelongsToMerchant(stationId, merchantId) {
        const result = await this.pool.query(
            'SELECT id FROM stations WHERE id = $1 AND merchant_id = $2',
            [stationId, merchantId]
        );
        if (result.rows.length === 0) {
            throw new PosError('STATION_ACCESS_DENIED', 'The selected station does not belong to this merchant.', 403);
        }
    }

    async listOperators({ userId }) {
        const merchantId = await this.getMerchantId(userId);
        const result = await this.pool.query(
            `SELECT o.id, o.station_id, s.name AS station_name, o.employee_number, o.full_name, o.phone, o.role, o.status, o.last_login_at, o.created_at
             FROM station_operators o
             JOIN stations s ON s.id = o.station_id
             WHERE o.merchant_id = $1
             ORDER BY o.created_at DESC`,
            [merchantId]
        );
        return { operators: result.rows };
    }

    async createOperator({ userId, stationId, employeeNumber, fullName, phone, password, role = 'ATTENDANT' }) {
        if (!stationId || !employeeNumber || !fullName || !password) {
            throw new PosError('VALIDATION_ERROR', 'stationId, employeeNumber, fullName, and password are required.', 400);
        }

        const merchantId = await this.getMerchantId(userId);
        await this.ensureStationBelongsToMerchant(stationId, merchantId);

        const passwordHash = await this.bcrypt.hash(password, 10);

        try {
            const result = await this.pool.query(
                `INSERT INTO station_operators
                    (merchant_id, station_id, employee_number, full_name, phone, password_hash, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
                 RETURNING id, station_id, employee_number, full_name, phone, role, status, created_at`,
                [merchantId, stationId, employeeNumber, fullName, phone || null, passwordHash, String(role || 'ATTENDANT').toUpperCase()]
            );
            return { operator: result.rows[0] };
        } catch (err) {
            if (err.code === '23505') {
                throw new PosError('EMPLOYEE_NUMBER_EXISTS', 'An operator with this employee number already exists for the station.', 409);
            }
            throw err;
        }
    }

    async updateOperatorStatus({ userId, operatorId, status }) {
        const merchantId = await this.getMerchantId(userId);
        const normalizedStatus = String(status || '').trim().toUpperCase();
        if (!['ACTIVE', 'SUSPENDED', 'DISABLED'].includes(normalizedStatus)) {
            throw new PosError('VALIDATION_ERROR', 'status must be ACTIVE, SUSPENDED, or DISABLED.', 400);
        }

        const result = await this.pool.query(
            `UPDATE station_operators
             SET status = $3, updated_at = NOW()
             WHERE id = $1
               AND merchant_id = $2
             RETURNING id, station_id, employee_number, full_name, role, status, updated_at`,
            [operatorId, merchantId, normalizedStatus]
        );

        if (result.rows.length === 0) {
            throw new PosError('OPERATOR_NOT_FOUND', 'POS operator not found.', 404);
        }

        return { operator: result.rows[0] };
    }
}

module.exports = OperatorManagementService;
