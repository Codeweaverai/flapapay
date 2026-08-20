const { PosError } = require('../utils/errors');

class OperatorAuthService {
    constructor({ pool, jwt, jwtSecret, bcrypt }) {
        this.pool = pool;
        this.jwt = jwt;
        this.jwtSecret = jwtSecret;
        this.bcrypt = bcrypt;
    }

    async loginOperator({ device, employeeNumber, password }) {
        if (!device?.station_id) {
            throw new PosError('DEVICE_STATION_MISMATCH', 'The device is not assigned to an active station.', 409);
        }

        if (!employeeNumber || !password) {
            throw new PosError('VALIDATION_ERROR', 'employeeNumber and password are required.', 400);
        }

        const result = await this.pool.query(
            `SELECT id, merchant_id, station_id, employee_number, full_name, role, status, password_hash
             FROM station_operators
             WHERE station_id = $1
               AND employee_number = $2`,
            [device.station_id, employeeNumber]
        );

        if (result.rows.length === 0) {
            throw new PosError('INVALID_OPERATOR_CREDENTIALS', 'Invalid operator credentials.', 401);
        }

        const operator = result.rows[0];
        if (String(operator.status).toUpperCase() !== 'ACTIVE') {
            throw new PosError('OPERATOR_NOT_ACTIVE', 'POS operator is not active.', 403);
        }

        const passwordValid = await this.bcrypt.compare(password, operator.password_hash);
        if (!passwordValid) {
            throw new PosError('INVALID_OPERATOR_CREDENTIALS', 'Invalid operator credentials.', 401);
        }

        await this.pool.query(
            'UPDATE station_operators SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
            [operator.id]
        );

        const sessionToken = this.jwt.sign(
            {
                type: 'pos_operator',
                operatorId: operator.id,
                stationId: operator.station_id,
                merchantId: operator.merchant_id,
                deviceId: device.id,
                role: operator.role,
            },
            this.jwtSecret,
            { expiresIn: '12h' }
        );

        return {
            operator: {
                id: operator.id,
                station_id: operator.station_id,
                employee_number: operator.employee_number,
                full_name: operator.full_name,
                role: operator.role,
            },
            session_token: sessionToken,
        };
    }

    async logoutOperator() {
        return { ok: true };
    }
}

module.exports = OperatorAuthService;
