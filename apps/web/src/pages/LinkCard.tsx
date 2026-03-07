import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Sidebar } from '../components/layout/Sidebar';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

const SetupForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: 'http://localhost:5173/settings',
            },
            redirect: 'if_required'
        });

        if (error) {
            setErrorMessage(error.message || 'An error occurred');
            setIsProcessing(false);
        } else {
            // Success
            navigate('/settings');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-1">
                <PaymentElement />
            </div>
            {errorMessage && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{errorMessage}</div>}
            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg"
            >
                {isProcessing ? 'Verifying Card...' : 'Link Card Securely'}
            </Button>
        </form>
    );
};

const SavedCardsList = ({ token }: { token: string | null }) => {
    const [cards, setCards] = useState<any[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (token) {
            api.get('/payments/methods')
                .then(res => setCards(res.data.methods))
                .catch(e => console.error(e));
        }
    }, [token]);

    if (cards.length === 0) return <p className="text-gray-400 text-sm italic">No linked cards yet.</p>;

    return (
        <div className="grid gap-3">
            {cards.map(card => {
                const isDefault = card.id === user?.defaultPaymentMethodId;
                return (
                    <div key={card.id} className={`p-4 rounded-xl border flex items-center justify-between ${isDefault ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-7 bg-gray-800 rounded text-white flex items-center justify-center text-[10px] font-bold uppercase">{card.card.brand}</div>
                            <div className="text-sm font-bold">•••• {card.card.last4}</div>
                        </div>
                        {isDefault && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">DEFAULT</span>}
                    </div>
                );
            })}
        </div>
    );
};

export const LinkCard: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        if (token) {
            api.post('/payments/create-setup-intent', {})
                .then(res => {
                    setClientSecret(res.data.clientSecret);
                }).catch(err => console.error('Failed to init setup intent', err));
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 flex flex-col max-w-3xl mx-auto">
                {/* Mobile Back (if sidebar hidden) */}
                <div className="md:hidden mb-6">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-500 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back
                    </button>
                </div>

                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900">Link a Card</h1>
                    <p className="text-gray-500 mt-2">Add a payment method for faster transfers and deposits.</p>
                </div>

                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 max-w-xl mx-auto md:mx-0 w-full">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Linked Cards</h3>
                        {/* We need to fetch cards here? We can reuse the logic or just rely on user knowing where to go.
                             But user asked for it to show here. Let's fetch them. 
                         */}
                        <SavedCardsList token={token} />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Card</h3>
                    {clientSecret ? (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <SetupForm />
                        </Elements>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                            <p className="text-gray-500 mt-4 font-medium">Initializing secure connection...</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center md:justify-start gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" /></svg>
                        <span>Encrypted by Stripe</span>
                    </div>
                </div>
            </main>
        </div>
    );
};
