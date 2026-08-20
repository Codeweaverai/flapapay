const express = require('express');
const authenticatePosDevice = require('../middleware/authenticatePosDevice');
const authenticatePosOperator = require('../middleware/authenticatePosOperator');
const OperatorAuthService = require('../services/OperatorAuthService');
const OperatorManagementService = require('../services/OperatorManagementService');
const { sendPosError } = require('../utils/errors');

module.exports = ({ pool, jwt, jwtSecret, bcrypt, authenticateToken }) => {
    const router = express.Router();
    const requirePosDevice = authenticatePosDevice({ pool, jwt, jwtSecret });
    const requirePosOperator = authenticatePosOperator({ pool, jwt, jwtSecret });
    const authService = new OperatorAuthService({ pool, jwt, jwtSecret, bcrypt });
    const managementService = new OperatorManagementService({ pool, bcrypt });

    router.get('/operators', authenticateToken, async (req, res) => {
        try {
            return res.json(await managementService.listOperators({ userId: req.user.id }));
        } catch (err) {
            console.error('[POS][OperatorsList]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/operators', authenticateToken, async (req, res) => {
        try {
            const payload = await managementService.createOperator({
                userId: req.user.id,
                stationId: req.body.station_id || req.body.stationId,
                employeeNumber: req.body.employee_number || req.body.employeeNumber,
                fullName: req.body.full_name || req.body.fullName,
                phone: req.body.phone,
                password: req.body.password,
                role: req.body.role,
            });
            return res.status(201).json(payload);
        } catch (err) {
            console.error('[POS][OperatorCreate]', err);
            return sendPosError(res, err);
        }
    });

    router.patch('/operators/:id/status', authenticateToken, async (req, res) => {
        try {
            return res.json(await managementService.updateOperatorStatus({
                userId: req.user.id,
                operatorId: req.params.id,
                status: req.body.status,
            }));
        } catch (err) {
            console.error('[POS][OperatorStatusUpdate]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/operators/login', requirePosDevice, async (req, res) => {
        try {
            const payload = await authService.loginOperator({
                device: req.posDevice,
                employeeNumber: req.body.employee_number || req.body.employeeNumber,
                password: req.body.password,
            });
            return res.json(payload);
        } catch (err) {
            console.error('[POS][OperatorLogin]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/operators/logout', requirePosOperator, async (req, res) => {
        try {
            const payload = await authService.logoutOperator();
            return res.json(payload);
        } catch (err) {
            console.error('[POS][OperatorLogout]', err);
            return sendPosError(res, err);
        }
    });

    return router;
};
