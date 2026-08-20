class PosError extends Error {
    constructor(code, message, status = 400, details = {}) {
        super(message);
        this.name = 'PosError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

const sendPosError = (res, err) => {
    const status = Number(err?.status) || 500;
    const code = err?.code || 'INTERNAL_ERROR';
    const message = err?.message || 'Unexpected POS error';

    return res.status(status).json({
        error: {
            code,
            message,
            details: err?.details || {},
        }
    });
};

module.exports = {
    PosError,
    sendPosError,
};
