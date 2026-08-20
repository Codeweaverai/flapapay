module.exports = {
    scoreSignals(signals = []) {
        const total = signals.reduce((sum, signal) => sum + Number(signal.weight || 0), 0);
        const severity = total >= 85 ? 'critical'
            : total >= 70 ? 'high'
            : total >= 40 ? 'medium'
            : 'low';
        return {
            score: total,
            severity
        };
    }
};
