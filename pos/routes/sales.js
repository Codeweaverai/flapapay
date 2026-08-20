const express = require('express');
const authenticatePosOperator = require('../middleware/authenticatePosOperator');
const SalesService = require('../services/SalesService');
const { sendPosError } = require('../utils/errors');

module.exports = ({ pool, jwt, jwtSecret, authenticateToken }) => {
    const router = express.Router();
    const salesService = new SalesService({ pool });
    const requirePosOperator = authenticatePosOperator({ pool, jwt, jwtSecret });

    router.get('/sales', authenticateToken, async (req, res) => {
        try {
            return res.json(await salesService.listSales({
                userId: req.user.id,
                limit: req.query.limit,
                status: req.query.status,
            }));
        } catch (err) {
            console.error('[POS][SalesList]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/sales', requirePosOperator, async (req, res) => {
        try {
            return res.status(201).json(await salesService.createSale({
                operator: req.posOperator,
                pumpId: req.body.pump_id || req.body.pumpId,
                customerReference: req.body.customer_reference || req.body.customerReference,
                fuelGrade: req.body.fuel_grade || req.body.fuelGrade,
                litres: req.body.litres,
                pricePerLitre: req.body.price_per_litre || req.body.pricePerLitre,
                amount: req.body.amount,
                currency: req.body.currency,
            }));
        } catch (err) {
            console.error('[POS][SaleCreate]', err);
            return sendPosError(res, err);
        }
    });

    router.get('/sales/current', requirePosOperator, async (req, res) => {
        try {
            return res.json(await salesService.listCurrentShiftSales({
                operator: req.posOperator,
                limit: req.query.limit,
            }));
        } catch (err) {
            console.error('[POS][CurrentShiftSales]', err);
            return sendPosError(res, err);
        }
    });

    router.post('/sales/:id/void', requirePosOperator, async (req, res) => {
        try {
            return res.json(await salesService.voidSale({
                operator: req.posOperator,
                saleId: req.params.id,
                reason: req.body.reason,
            }));
        } catch (err) {
            console.error('[POS][SaleVoid]', err);
            return sendPosError(res, err);
        }
    });

    return router;
};
