const crypto = require('crypto');
const { PosError } = require('../utils/errors');
const { createPrefixedReference } = require('../utils/references');

class DeviceService {
    constructor({ pool, jwt, jwtSecret }) {
        this.pool = pool;
        this.jwt = jwt;
        this.jwtSecret = jwtSecret;
    }

    async listDevices({ userId }) {
        const merchantRes = await this.pool.query('SELECT id FROM merchants WHERE user_id = $1', [userId]);
        if (merchantRes.rows.length === 0) {
            throw new PosError('MERCHANT_NOT_FOUND', 'Merchant not found for this user.', 404);
        }

        const result = await this.pool.query(
            `SELECT d.id,
                    d.station_id,
                    d.device_code,
                    d.label,
                    d.platform,
                    d.model,
                    d.serial_number,
                    d.app_version,
                    d.activation_status,
                    d.operational_status,
                    d.last_seen_at,
                    d.activated_at,
                    d.created_at,
                    s.name AS station_name
             FROM pos_devices d
             LEFT JOIN stations s ON s.id = d.station_id
             WHERE d.merchant_id = $1
             ORDER BY d.created_at DESC`,
            [merchantRes.rows[0].id]
        );

        return {
            devices: result.rows,
        };
    }

    async registerDevice({ userId, stationId, label, platform = 'SUNMI', model, serialNumber, appVersion }) {
        try {
            if (!stationId || !label || !model || !serialNumber) {
                throw new PosError('VALIDATION_ERROR', 'stationId, label, model, and serialNumber are required.', 400);
            }

            const merchantRes = await this.pool.query('SELECT id FROM merchants WHERE user_id = $1', [userId]);
            if (merchantRes.rows.length === 0) {
                throw new PosError('MERCHANT_NOT_FOUND', 'Merchant not found for this user.', 404);
            }
            const merchantId = merchantRes.rows[0].id;

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

            const activationToken = crypto.randomBytes(24).toString('hex');
            const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');
            const deviceCode = createPrefixedReference('POSDEV', 5);

            const result = await this.pool.query(
                `INSERT INTO pos_devices
                    (merchant_id, station_id, device_code, label, platform, model, serial_number, app_version, activation_status, operational_status, activation_token_hash, device_token_version)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_ACTIVATION', 'ACTIVE', $9, 1)
                 RETURNING id, station_id, label, model, serial_number, activation_status, created_at`,
                [merchantId, stationId, deviceCode, label, String(platform || 'SUNMI').toUpperCase(), model, serialNumber, appVersion || null, activationTokenHash]
            );

            return {
                device: result.rows[0],
                activation_token: activationToken,
            };
        } catch (err) {
            if (err instanceof PosError) throw err;
            if (err.code === '23505') {
                throw new PosError('DEVICE_ALREADY_EXISTS', 'A POS device with this serial number already exists.', 409);
            }
            throw err;
        }
    }

    async activateDevice({ activationToken, serialNumber, appVersion }) {
        if (!activationToken || !serialNumber) {
            throw new PosError('VALIDATION_ERROR', 'activationToken and serialNumber are required.', 400);
        }

        const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');
        const result = await this.pool.query(
            `UPDATE pos_devices
             SET activation_status = 'ACTIVE',
                 activated_at = NOW(),
                 app_version = COALESCE($3, app_version),
                 activation_token_hash = NULL,
                 updated_at = NOW()
             WHERE activation_token_hash = $1
               AND serial_number = $2
             RETURNING id, merchant_id, station_id, label, model, serial_number, activation_status, device_token_version`,
            [activationTokenHash, serialNumber, appVersion || null]
        );

        if (result.rows.length === 0) {
            throw new PosError('INVALID_ACTIVATION_TOKEN', 'Activation token is invalid or does not match this device.', 403);
        }

        const device = result.rows[0];
        const deviceAccessToken = this.jwt.sign(
            {
                type: 'pos_device',
                deviceId: device.id,
                stationId: device.station_id,
                tokenVersion: device.device_token_version || 1,
            },
            this.jwtSecret,
            { expiresIn: '30d' }
        );

        return {
            device,
            device_access_token: deviceAccessToken,
        };
    }

    async recordHeartbeat({ deviceId, batteryLevel, networkStatus, printerStatus, scannerStatus, nfcStatus, appVersion, ipAddress, userAgent }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `INSERT INTO device_heartbeats
                    (device_id, battery_level, network_status, printer_status, scanner_status, nfc_status, app_version, ip_address)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [deviceId, batteryLevel ?? null, networkStatus || null, printerStatus || null, scannerStatus || null, nfcStatus || null, appVersion || null, ipAddress || null]
            );

            await client.query(
                `UPDATE pos_devices
                 SET last_seen_at = NOW(),
                     app_version = COALESCE($2, app_version),
                     last_ip_address = $3,
                     last_user_agent = $4,
                     updated_at = NOW()
                 WHERE id = $1`,
                [deviceId, appVersion || null, ipAddress || null, userAgent || null]
            );
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        return {
            ok: true,
            server_time: new Date().toISOString(),
        };
    }

    buildReceiptTestPayload({ device }) {
        return {
            receipt: {
                merchant_name: 'FlapaPay Test',
                station_name: device?.label || 'Device Setup',
                amount: 0,
                currency: 'ZMW',
                payment_method: 'TEST',
                status: 'READY',
                footer: 'PRINTER TEST'
            }
        };
    }
}

module.exports = DeviceService;
