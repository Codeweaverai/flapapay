import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';

interface Transaction {
    id: string;
    type: string;
    amount: string;
    currency: string;
    date: string;
    status: string;
    description: string;
    recipient?: string;
    sender?: string;
}

export const TransactionsPage: React.FC = () => {
    // const { user, token } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would fetch from the API
        // Mock data for demonstration
        const mockTransactions: Transaction[] = [
            {
                id: '1',
                type: 'sent',
                amount: '25.00',
                currency: 'USD',
                date: '2023-05-15',
                status: 'completed',
                description: 'Payment to John Doe',
                recipient: 'john@example.com'
            },
            {
                id: '2',
                type: 'received',
                amount: '50.00',
                currency: 'USD',
                date: '2023-05-14',
                status: 'completed',
                description: 'Payment from Jane Smith',
                sender: 'jane@example.com'
            },
            {
                id: '3',
                type: 'sent',
                amount: '15.00',
                currency: 'USD',
                date: '2023-05-12',
                status: 'completed',
                description: 'Mobile money transfer',
                recipient: '+2348012345678'
            },
            {
                id: '4',
                type: 'fee',
                amount: '1.50',
                currency: 'USD',
                date: '2023-05-10',
                status: 'completed',
                description: 'Transaction fee'
            },
            {
                id: '5',
                type: 'deposit',
                amount: '200.00',
                currency: 'USD',
                date: '2023-05-08',
                status: 'completed',
                description: 'Bank deposit'
            }
        ];

        setTransactions(mockTransactions);
        setIsLoading(false);
    }, []);

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === 'all') return true;
        return transaction.type === filter;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Transactions</h1>
                    <p className="text-[var(--color-text-muted)]">View and manage your transaction history</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--color-text-main)]">All Transactions</h2>
                                <p className="text-[var(--color-text-muted)]">{transactions.length} total transactions</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all'
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-gray-100 text-[var(--color-text-main)] hover:bg-gray-200'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('sent')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'sent'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-[var(--color-text-main)] hover:bg-gray-200'
                                        }`}
                                >
                                    Sent
                                </button>
                                <button
                                    onClick={() => setFilter('received')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'received'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-[var(--color-text-main)] hover:bg-gray-200'
                                        }`}
                                >
                                    Received
                                </button>
                                <button
                                    onClick={() => setFilter('deposit')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'deposit'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-[var(--color-text-main)] hover:bg-gray-200'
                                        }`}
                                >
                                    Deposits
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-[var(--color-text-muted)]">
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-[var(--color-text-main)]">{transaction.description}</div>
                                                {transaction.recipient && (
                                                    <div className="text-sm text-[var(--color-text-muted)]">To: {transaction.recipient}</div>
                                                )}
                                                {transaction.sender && (
                                                    <div className="text-sm text-[var(--color-text-muted)]">From: {transaction.sender}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-[var(--color-text-main)]">{formatDate(transaction.date)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === 'sent' ? 'bg-red-100 text-red-800' :
                                                    transaction.type === 'received' ? 'bg-green-100 text-green-800' :
                                                        transaction.type === 'deposit' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <span className={`${transaction.type === 'received' || transaction.type === 'deposit'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {transaction.type === 'received' || transaction.type === 'deposit' ? '+' : '-'}{transaction.currency} {transaction.amount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-[var(--color-text-muted)]">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};