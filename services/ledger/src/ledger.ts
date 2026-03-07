import { getClient, query } from './db';
import { v4 as uuidv4 } from 'uuid';

interface TransactionRequest {
    reference: string;
    debitWalletId: string; // Source
    creditWalletId: string; // Destination
    amount: number;
    currency: string;
    description?: string;
    type: string;
}

export const LedgerService = {
    // Create a new wallet
    async createWallet(userId: string, currency: string) {
        const result = await query(
            `INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, 0.00) RETURNING *`,
            [userId, currency]
        );
        return result.rows[0];
    },

    // Get wallet balance
    async getWallet(walletId: string) {
        const result = await query(`SELECT * FROM wallets WHERE id = $1`, [walletId]);
        return result.rows[0];
    },

    // Record a transaction (Double Entry)
    async recordTransaction(tx: TransactionRequest) {
        // Basic validation
        if (tx.amount <= 0) throw new Error("Amount must be positive");
        if (tx.debitWalletId === tx.creditWalletId) throw new Error("Cannot transfer to same wallet");

        const client = await getClient();

        try {
            await client.query('BEGIN');

            // 1. Check Debit Wallet Balance (for atomic consistency)
            // Lock row for update to prevent race conditions
            const debitRes = await client.query(
                `SELECT balance, currency FROM wallets WHERE id = $1 FOR UPDATE`,
                [tx.debitWalletId]
            );

            if (debitRes.rows.length === 0) throw new Error("Debit wallet not found");
            const debitWallet = debitRes.rows[0];

            if (debitWallet.currency !== tx.currency) throw new Error("Currency mismatch on debit wallet");
            if (parseFloat(debitWallet.balance) < tx.amount) {
                throw new Error("Insufficient funds");
            }

            // 2. Check Credit Wallet
            const creditRes = await client.query(
                `SELECT currency FROM wallets WHERE id = $1 FOR UPDATE`,
                [tx.creditWalletId]
            );
            if (creditRes.rows.length === 0) throw new Error("Credit wallet not found");
            if (creditRes.rows[0].currency !== tx.currency) throw new Error("Currency mismatch on credit wallet");

            // 3. Create Ledger Entry
            // Note: In a pure double-entry system, we might create TWO rows (one for debit, one for credit).
            // But our schema has `debit_wallet_id` and `credit_wallet_id` on a SINGLE row for simplicity in this MVP.
            // This single row represents the movement. 
            // Ideally, a "Journal Entry" has multiple "Ledger Lines".
            // Given our schema:
            /*
            CREATE TABLE ledger_entries (
                ...
                debit_wallet_id UUID REFERENCES wallets(id),
                credit_wallet_id UUID REFERENCES wallets(id),
                ...
            );
            */
            // This schema effectively links the two.

            const entryRes = await client.query(
                `INSERT INTO ledger_entries 
        (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED')
        RETURNING *`,
                [tx.reference, tx.debitWalletId, tx.creditWalletId, tx.amount, tx.currency, tx.description, tx.type]
            );

            // 4. Update Balances
            await client.query(
                `UPDATE wallets SET balance = balance - $1 WHERE id = $2`,
                [tx.amount, tx.debitWalletId]
            );

            await client.query(
                `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
                [tx.amount, tx.creditWalletId]
            );

            await client.query('COMMIT');
            return entryRes.rows[0];

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};
