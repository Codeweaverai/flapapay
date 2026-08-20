const express = require('express');
const authenticatePosDevice = require('../middleware/authenticatePosDevice');
const DeviceService = require('../services/DeviceService');
const { PosError, sendPosError } = require('../utils/errors');

module.exports = ({ pool, jwt, jwtSecret, authenticateToken }) => {
    const router = express.Router();
    const deviceService = new DeviceService({ pool, jwt, jwtSecret });
    const requirePosDevice = authenticatePosDevice({ pool, jwt, jwtSecret });

    router.get('/devices', authenticateToken, async (req, res) => {
        try {
            return res.json(await deviceService.listDevices({ userId: req.user.id }));
        } catch (err) {
            console.error('[POS][DeviceList]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/devices/register', authenticateToken, async (req, res) => {
        try {
            const payload = await deviceService.registerDevice({
                userId: req.user.id,
                stationId: req.body.stationId,
                label: req.body.label,
                platform: req.body.platform,
                model: req.body.model,
                serialNumber: req.body.serialNumber,
                appVersion: req.body.appVersion,
            });
            return res.status(201).json(payload);
        } catch (err) {
            console.error('[POS][DeviceRegister]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/devices/activate', async (req, res) => {
        try {
            const payload = await deviceService.activateDevice({
                activationToken: req.body.activation_token || req.body.activationToken,
                serialNumber: req.body.serial_number || req.body.serialNumber,
                appVersion: req.body.app_version || req.body.appVersion,
            });
            return res.json(payload);
        } catch (err) {
            console.error('[POS][DeviceActivate]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/devices/heartbeat', requirePosDevice, async (req, res) => {
        try {
            const payload = await deviceService.recordHeartbeat({
                deviceId: req.posDevice.id,
                batteryLevel: req.body.battery_level ?? req.body.batteryLevel,
                networkStatus: req.body.network_status || req.body.networkStatus,
                printerStatus: req.body.printer_status || req.body.printerStatus,
                scannerStatus: req.body.scanner_status || req.body.scannerStatus,
                nfcStatus: req.body.nfc_status || req.body.nfcStatus,
                appVersion: req.body.app_version || req.body.appVersion,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || null,
            });
            return res.json(payload);
        } catch (err) {
            console.error('[POS][DeviceHeartbeat]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/devices/:id/receipt-test', requirePosDevice, async (req, res) => {
        try {
            if (req.params.id !== req.posDevice.id) {
                throw new PosError('DEVICE_STATION_MISMATCH', 'The requested device does not match the authenticated device.', 403);
            }
            return res.json(deviceService.buildReceiptTestPayload({ device: req.posDevice }));
        } catch (err) {
            console.error('[POS][DeviceReceiptTest]', err);
            return sendPosError(res, err);
        }
    });

    return router;
};
