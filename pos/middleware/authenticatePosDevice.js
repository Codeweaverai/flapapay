const { PosError, sendPosError } = require('../utils/errors');

const authenticatePosDevice = ({ pool, jwt, jwtSecret }) => async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendPosError(res, new PosError('DEVICE_TOKEN_REQUIRED', 'Device access token required.', 401));
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (decoded.type !== 'pos_device' || !decoded.deviceId) {
            throw new PosError('INVALID_DEVICE_TOKEN', 'Invalid device token.', 403);
        }

        const result = await pool.query(
            `SELECT id, merchant_id, station_id, label, model, serial_number, activation_status, operational_status, device_token_version
             FROM pos_devices
             WHERE id = $1`,
            [decoded.deviceId]
        );

        if (result.rows.length === 0) {
            throw new PosError('DEVICE_NOT_FOUND', 'POS device not found.', 404);
        }

        const device = result.rows[0];
        if (device.activation_status !== 'ACTIVE') {
            throw new PosError('DEVICE_NOT_ACTIVE', 'The device is not active for this station.', 403);
        }

        if (device.operational_status !== 'ACTIVE') {
            throw new PosError('DEVICE_DISABLED', 'The device is not operational.', 403);
        }

        if (Number(decoded.tokenVersion || 1) !== Number(device.device_token_version || 1)) {
            throw new PosError('DEVICE_TOKEN_REVOKED', 'The device token is no longer valid.', 403);
        }

        req.posDevice = {
            id: device.id,
            merchant_id: device.merchant_id,
            station_id: device.station_id,
            label: device.label,
            model: device.model,
            serial_number: device.serial_number,
        };
        next();
    } catch (err) {
        if (err instanceof PosError) {
            return sendPosError(res, err);
        }
        return sendPosError(res, new PosError('INVALID_DEVICE_TOKEN', 'Invalid or expired device token.', 403));
    }
};

module.exports = authenticatePosDevice;
