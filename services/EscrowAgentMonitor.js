const { Pool } = require('pg');
const { OpenAI } = require('openai');
const EscrowService = require('./EscrowService');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class EscrowAgentMonitor {
    static async evaluateTransactions() {
        console.log('[EscrowAgentMonitor] Starting evaluation cycle...');
        try {
            // 1. Fetch active escrows that might need attention (FUNDED, DELIVERED, DISPUTED)
            const result = await pool.query(
                `SELECT 
                    id, amount, currency, status, created_at, updated_at, 
                    delivery_timeframe, inspection_period, instructions
                 FROM escrows 
                 WHERE status IN ('FUNDED', 'DELIVERED', 'DISPUTED', 'RELEASE_REQUESTED')`
            );

            const escrows = result.rows;
            if (escrows.length === 0) {
                console.log('[EscrowAgentMonitor] No active escrows to monitor.');
                return;
            }

            // 2. Determine potential issues locally (time-based) to save API calls
            const now = new Date();
            const escrowsToEvaluate = escrows.filter(e => {
                const updatedTime = new Date(e.updated_at || e.created_at);
                const diffDays = (now - updatedTime) / (1000 * 60 * 60 * 24);

                // If FUNDED and past delivery timeframe
                if (e.status === 'FUNDED' && diffDays > (e.delivery_timeframe || 7)) return true;

                // If DELIVERED and past inspection period
                if (e.status === 'DELIVERED' && diffDays > (e.inspection_period || 3)) return true;

                // If DISPUTED or RELEASE_REQUESTED, always evaluate
                if (e.status === 'DISPUTED' || e.status === 'RELEASE_REQUESTED') return true;

                return false;
            });

            if (escrowsToEvaluate.length === 0) {
                console.log('[EscrowAgentMonitor] All active escrows are within valid timeframes.');
                return;
            }

            console.log(`[EscrowAgentMonitor] Found ${escrowsToEvaluate.length} escrows requiring AI evaluation.`);

            // 3. Evaluate each one using OpenAI
            for (const escrow of escrowsToEvaluate) {
                await this.analyzeEscrow(escrow);
            }

        } catch (error) {
            console.error('[EscrowAgentMonitor] Evaluation error:', error);
        }
    }

    static async analyzeEscrow(escrow) {
        try {
            const prompt = `
            You are an expert financial dispute resolution agent working for FlapaPay.
            Review the following Escrow transaction data and determine if it requires Admin intervention.
            
            TRANSACTION DETAILS:
            - ID: ${escrow.id}
            - Amount: ${escrow.amount} ${escrow.currency}
            - Current Status: ${escrow.status}
            - Days since last update: ${((new Date() - new Date(escrow.updated_at)) / (1000 * 60 * 60 * 24)).toFixed(1)}
            - Allowed Delivery Timeframe (Days): ${escrow.delivery_timeframe}
            - Allowed Inspection Period (Days): ${escrow.inspection_period}
            - Rules/Instructions: ${escrow.instructions || 'None'}

            Evaluate the risk. Respond ONLY with a valid JSON object in the following format:
            {
                "requires_intervention": boolean,
                "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                "reason": "Short, 1-2 sentence explanation of the specific risk factor.",
                "recommended_action": "None" | "Force Release to Seller" | "Force Refund to Buyer" | "Contact Parties"
            }
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    { role: "system", content: "You are an automated risk analysis agent. Output valid JSON only." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const analysis = JSON.parse(completion.choices[0].message.content);
            console.log(`[EscrowAgentMonitor] Analysis for ${escrow.id.substring(0, 8)}:`, analysis);

            // 4. If intervention is required, notify admins
            if (analysis.requires_intervention && analysis.risk_level !== 'LOW') {
                await this.notifyAdmins(escrow, analysis);
            }

            // 5. If it's a release request and risk is LOW, auto-release
            if (escrow.status === 'RELEASE_REQUESTED' && !analysis.requires_intervention && analysis.risk_level === 'LOW') {
                console.log(`[EscrowAgentMonitor] Auto-releasing low-risk escrow ${escrow.id.substring(0, 8)}`);
                await EscrowService.releaseFunds(escrow.id, 'AI_MONITOR');
            }

        } catch (error) {
            console.error(`[EscrowAgentMonitor] Analysis failed for escrow ${escrow.id}:`, error);
        }
    }

    static async notifyAdmins(escrow, analysis) {
        const client = await pool.connect();
        try {
            // Check if we recently notified about this specific escrow to avoid spam
            const recentNotifRes = await client.query(
                `SELECT id FROM admin_notifications 
                 WHERE type = 'escrow' 
                 AND message LIKE $1
                 AND created_at > NOW() - INTERVAL '24 hours'`,
                [`%Escrow ${escrow.id.substring(0, 8)}%`]
            );

            if (recentNotifRes.rows.length === 0) {
                await client.query(
                    `INSERT INTO admin_notifications (title, message, type, read, created_at)
                     VALUES ($1, $2, 'escrow', false, NOW())`,
                    [
                        `AI Risk: ${analysis.risk_level}`,
                        `Escrow ${escrow.id.substring(0, 8)} requires intervention. Reason: ${analysis.reason}. Recommendation: ${analysis.recommended_action}.`
                    ]
                );
                console.log(`[EscrowAgentMonitor] Private admin alarm raised for escrow ${escrow.id.substring(0, 8)}`);
            }
        } catch (error) {
            console.error('[EscrowAgentMonitor] Failed to log admin notification:', error);
        } finally {
            client.release();
        }
    }
}

module.exports = EscrowAgentMonitor;
