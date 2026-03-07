import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/axios';

interface SendInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
    clientEmail: string;
    invoiceNumber: string;
    onSuccess: () => void;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
    isOpen, onClose, invoiceId, clientEmail, invoiceNumber, onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(`Invoice ${invoiceNumber} from FlapaPay Merchant`);
    const [message, setMessage] = useState('Please find details of your invoice below. Thank you for your business!');
    const [showPreview, setShowPreview] = useState(false);

    const handleSend = async () => {
        setLoading(true);
        try {
            await api.post(`/v1/invoices/${invoiceId}/send`, {
                cc,
                bcc,
                subject,
                body: `<p>${message.replace(/\n/g, '<br/>')}</p>` // Simple text to HTML conversion
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to send invoice:', error);
            alert(error.response?.data?.error || 'Failed to send invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send Invoice ${invoiceNumber}`}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">To</label>
                    <input
                        type="text"
                        value={clientEmail}
                        disabled
                        className="w-full px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">CC (Comma separated)</label>
                        <input
                            type="text"
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                            placeholder="manager@client.com, ..."
                            className="w-full px-4 py-2 rounded-xl bg-white border border-gray-200 focus:border-black outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">BCC (Hidden)</label>
                        <input
                            type="text"
                            value={bcc}
                            onChange={(e) => setBcc(e.target.value)}
                            placeholder="accounting@mycompany.com"
                            className="w-full px-4 py-2 rounded-xl bg-white border border-gray-200 focus:border-black outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white border border-gray-200 focus:border-black outline-none transition-all"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                        <label className="block text-sm font-bold text-gray-700">Message</label>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                            {showPreview ? 'Edit Message' : 'Preview Email'}
                        </button>
                    </div>

                    {showPreview ? (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 whitespace-pre-wrap min-h-[120px]">
                            {message}
                            <div className="mt-4 pt-4 border-t border-gray-200 text-gray-400 text-xs text-center">
                                [Invoice PDF and Payment Link will be attached automatically]
                            </div>
                        </div>
                    ) : (
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-black outline-none transition-all resize-none"
                        />
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        Send Invoice
                    </button>
                </div>
            </div>
        </Modal>
    );
};
