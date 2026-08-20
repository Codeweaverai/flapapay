const express = require('express');
const StationService = require('../services/StationService');
const { sendPosError } = require('../utils/errors');

module.exports = ({ pool, authenticateToken }) => {
    const router = express.Router();
    const stationService = new StationService({ pool });

    router.get('/stations', authenticateToken, async (req, res) => {
        try {
            return res.json(await stationService.listStations({ userId: req.user.id }));
        } catch (err) {
            console.error('[POS][StationsList]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/stations', authenticateToken, async (req, res) => {
        try {
            const payload = await stationService.createStation({
                userId: req.user.id,
                code: req.body.code,
                name: req.body.name,
                city: req.body.city,
                addressLine1: req.body.address_line_1 || req.body.addressLine1,
                addressLine2: req.body.address_line_2 || req.body.addressLine2,
                timezone: req.body.timezone,
            });
            return res.status(201).json(payload);
        } catch (err) {
            console.error('[POS][StationCreate]', err);
            return sendPosError(res, err);
        }
    });

    router.get('/pumps', authenticateToken, async (req, res) => {
        try {
            return res.json(await stationService.listPumps({ userId: req.user.id }));
        } catch (err) {
            console.error('[POS][PumpsList]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/pumps', authenticateToken, async (req, res) => {
        try {
            return res.status(201).json(await stationService.createPump({
                userId: req.user.id,
                stationId: req.body.station_id || req.body.stationId,
                code: req.body.code,
                label: req.body.label,
                fuelGrade: req.body.fuel_grade || req.body.fuelGrade,
            }));
        } catch (err) {
            console.error('[POS][PumpCreate]', err);
            return sendPosError(res, err);
        }
    });

    router.patch('/pumps/:id/status', authenticateToken, async (req, res) => {
        try {
            return res.json(await stationService.updatePumpStatus({
                userId: req.user.id,
                pumpId: req.params.id,
                status: req.body.status,
            }));
        } catch (err) {
            console.error('[POS][PumpStatusUpdate]', err);
            return sendPosError(res, err);
        }
    });

    return router;
};
