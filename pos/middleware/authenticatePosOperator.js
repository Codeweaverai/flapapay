const { PosError, sendPosError } = require('../utils/errors');

const authenticatePosOperator = ({ pool, jwt, jwtSecret }) => async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendPosError(res, new PosError('OPERATOR_TOKEN_REQUIRED', 'Operator session token required.', 401));
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (decoded.type !== 'pos_operator' || !decoded.operatorId || !decoded.deviceId) {
            throw new PosError('INVALID_OPERATOR_TOKEN', 'Invalid operator token.', 403);
        }

        const result = await pool.query(
            `SELECT o.id, o.merchant_id, o.station_id, o.employee_number, o.full_name, o.role, o.status,
                    d.id AS device_id, d.activation_status, d.operational_status
             FROM station_operators o
             JOIN pos_devices d
               ON d.id = $2
             WHERE o.id = $1`,
            [decoded.operatorId, decoded.deviceId]
        );

        if (result.rows.length === 0) {
            throw new PosError('OPERATOR_NOT_FOUND', 'POS operator not found.', 404);
        }

        const row = result.rows[0];
        if (String(row.status).toUpperCase() !== 'ACTIVE') {
            throw new PosError('OPERATOR_NOT_ACTIVE', 'POS operator is not active.', 403);
        }

        if (String(row.activation_status).toUpperCase() !== 'ACTIVE' || String(row.operational_status).toUpperCase() !== 'ACTIVE') {
            throw new PosError('DEVICE_NOT_ACTIVE', 'The linked device is not active.', 403);
        }

        req.posOperator = {
            id: row.id,
            merchant_id: row.merchant_id,
            station_id: row.station_id,
            employee_number: row.employee_number,
            full_name: row.full_name,
            role: row.role,
            device_id: row.device_id,
        };
        next();
    } catch (err) {
        if (err instanceof PosError) {
            return sendPosError(res, err);
        }
        return sendPosError(res, new PosError('INVALID_OPERATOR_TOKEN', 'Invalid or expired operator token.', 403));
    }
};

module.exports = authenticatePosOperator;
