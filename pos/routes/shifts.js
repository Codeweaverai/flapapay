const express = require('express');
const authenticatePosOperator = require('../middleware/authenticatePosOperator');
const ShiftService = require('../services/ShiftService');
const { sendPosError } = require('../utils/errors');

module.exports = ({ pool, jwt, jwtSecret, authenticateToken }) => {
    const router = express.Router();
    const requirePosOperator = authenticatePosOperator({ pool, jwt, jwtSecret });
    const shiftService = new ShiftService({ pool });

    router.get('/shifts', authenticateToken, async (req, res) => {
        try {
            return res.json(await shiftService.listShifts({
                userId: req.user.id,
                limit: req.query.limit,
            }));
        } catch (err) {
            console.error('[POS][ShiftsList]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/shifts/open', requirePosOperator, async (req, res) => {
        try {
            return res.status(201).json(await shiftService.openShift({
                operator: req.posOperator,
                openingNote: req.body.opening_note || req.body.openingNote,
                openingCashAmount: req.body.opening_cash_amount ?? req.body.openingCashAmount ?? null,
            }));
        } catch (err) {
            console.error('[POS][ShiftOpen]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/shifts/close', requirePosOperator, async (req, res) => {
        try {
            return res.json(await shiftService.closeShift({
                operator: req.posOperator,
                closingNote: req.body.closing_note || req.body.closingNote,
                closingCashAmount: req.body.closing_cash_amount ?? req.body.closingCashAmount ?? null,
            }));
        } catch (err) {
            console.error('[POS][ShiftClose]', err);
            return sendPosError(res, err);
        }
    });

    return router;
};
