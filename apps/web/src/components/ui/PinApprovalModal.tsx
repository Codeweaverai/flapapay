import React, { useState } from 'react';
import { Loader2, Lock, X } from 'lucide-react';

interface PinApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (pin: string) => Promise<void>;
    title?: string;
    description?: string;
    isSubmitting?: boolean;
}

export const PinApprovalModal: React.FC<PinApprovalModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = "Transaction Security",
    description = "Enter your 4-digit security PIN to approve this transaction.",
    isSubmitting: externalIsSubmitting = false
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const isSubmitting = externalIsSubmitting || internalIsSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) return;

        setError(null);
        setInternalIsSubmitting(true);
        try {
            await onSuccess(pin);
            setPin('');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid security PIN');
            setPin('');
        } finally {
            setInternalIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header decor */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10" />

                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>

                    <div className="flex flex-col items-center text-center mt-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                            <Lock className="w-8 h-8 text-orange-600" />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
                        <p className="text-gray-500 mb-8 max-w-[280px]">{description}</p>

                        {error && (
                            <div className="w-full p-3 mb-6 bg-red-50 text-red-600 text-sm font-bold rounded-xl animate-shake">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="relative mb-8">
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    placeholder="••••"
                                    autoFocus
                                    className="w-full h-16 text-center text-4xl tracking-[1.2em] font-black bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 focus:outline-none transition-all placeholder:text-gray-200"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    required
                                    maxLength={4}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || pin.length !== 4}
                                className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Approving...</span>
                                    </>
                                ) : (
                                    <span>Approve & Continue</span>
                                )}
                            </button>

                            <p className="mt-6 text-gray-400 text-xs font-medium uppercase tracking-widest">
                                Secure end-to-end encrypted approval
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
