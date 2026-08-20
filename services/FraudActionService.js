module.exports = {
    async recordAction(db, action = {}) {
        const result = await db.query(
            `INSERT INTO fraud_actions (fraud_case_id, action_type, target_type, target_id, executed_by, status, metadata, executed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
             RETURNING *`,
            [
                action.fraudCaseId || null,
                action.actionType,
                action.targetType,
                action.targetId || null,
                action.executedBy || null,
                action.status || 'recorded',
                JSON.stringify(action.metadata || {})
            ]
        );
        return {
            ...action,
            status: action.status || 'recorded',
            id: result.rows[0]?.id || null
        };
    }
};
