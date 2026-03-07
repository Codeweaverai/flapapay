import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Sparkles, Mail,
    ShieldCheck, Eye, EyeOff, Paperclip,
    ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';

interface Invoice {
    id: string;
    invoice_number: string;
    client_name: string;
    client_email: string;
    total_amount: string;
    currency: string;
    logo_url?: string;
}

export const SendInvoicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    // Email fields
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('We appreciate your business. Please find the details for your latest invoice below. You can complete the payment securely using the link provided in this dispatch.');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (id) fetchInvoice(id);
    }, [id]);

    const fetchInvoice = async (invoiceId: string) => {
        try {
            const response = await api.get(`/v1/invoices/${invoiceId}`);
            const data = response.data;
            setInvoice(data);
            setSubject(`Invoice ${data.invoice_number} from FlapaPay Merchant`);
        } catch (error) {
            console.error('Failed to fetch invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!id) return;
        setSending(true);
        try {
            await api.post(`/v1/invoices/${id}/send`, {
                cc,
                bcc,
                subject,
                body: message
            });
            setSuccess(true);
            setTimeout(() => navigate('/invoices'), 2000);
        } catch (error: any) {
            console.error('Failed to send invoice:', error);
            alert(error.response?.data?.error || 'Failed to send invoice');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="h-14 w-14 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Preparing Communication Channel...</p>
            </div>
        </div>
    );

    if (!invoice) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center p-12 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-gray-900">Invoice Not Found</h2>
                <button onClick={() => navigate('/invoices')} className="mt-6 px-8 py-3 bg-black text-white rounded-xl font-bold transition-all hover:scale-105">Return to Vault</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFF] flex overflow-x-hidden">
            <Sidebar />

            <div className="flex-1 md:ml-72 transition-all duration-300">
                <main className="p-8 lg:p-14 max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="h-14 w-14 flex items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-500 transition-all active:scale-95 group"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Dispatch Engine
                                    <Sparkles className="w-6 h-6 text-orange-400" />
                                </h1>
                                <p className="text-gray-400 font-bold mt-1 text-sm">Reviewing transmission for {invoice.client_name}</p>
                            </div>
                        </div>

                        {invoice.logo_url && (
                            <div className="h-16 w-32 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex items-center justify-center overflow-hidden">
                                <img src={invoice.logo_url} alt="Brand Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                        )}
                    </header>

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] border-4 border-white">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 text-center uppercase tracking-tighter">Transmission Authorized</h2>
                            <p className="text-gray-500 font-bold text-center">Your invoice has been securely delivered to {invoice.client_email}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-stretch">
                            {/* Card 1: Encrypted Recipient Card */}
                            <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>

                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center text-white shadow-inner flex-shrink-0">
                                            <ShieldCheck className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1.5 flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-orange-500" /> Dispatch Destination
                                            </p>
                                            <h3 className="text-2xl font-black tracking-tight">Recipient Metadata</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Primary Email (Secured)</label>
                                            <div className="px-8 py-5 bg-white/5 rounded-2xl font-black text-white text-xl border border-white/10 transition-all truncate">
                                                {invoice.client_email}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
                                                    <Paperclip className="w-2 h-2" /> CC Protocol
                                                </label>
                                                <input
                                                    type="text"
                                                    value={cc}
                                                    onChange={(e) => setCc(e.target.value)}
                                                    placeholder="finance@firm.com"
                                                    className="w-full px-8 py-5 bg-white/5 rounded-2xl font-bold text-white placeholder:text-white/10 border border-white/5 focus:border-orange-500 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
                                                    <EyeOff className="w-2 h-2" /> BCC Protocol
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bcc}
                                                    onChange={(e) => setBcc(e.target.value)}
                                                    placeholder="audit@vault.com"
                                                    className="w-full px-8 py-5 bg-white/5 rounded-2xl font-bold text-white placeholder:text-white/10 border border-white/5 focus:border-orange-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 pt-8 mt-8 border-t border-white/5 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2 justify-center">
                                    <ShieldCheck className="w-3 h-3" /> All transmission data is encrypted via TLS 1.3
                                </div>
                            </div>

                            {/* Card 2: Live Preview Node */}
                            <div className="bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between min-h-[400px]">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" /> Visual Dispatch Preview
                                        </h3>
                                        <div className="bg-emerald-50 text-emerald-600 rounded-full px-4 py-1.5 flex items-center gap-2 border border-emerald-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Node Active</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 space-y-6 relative group cursor-pointer hover:bg-white transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice Amount</p>
                                                <p className="text-3xl font-black text-gray-900">{invoice.currency} {parseFloat(invoice.total_amount).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identification</p>
                                                <p className="font-black text-gray-900">№ {invoice.invoice_number}</p>
                                            </div>
                                        </div>

                                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full w-3/4 bg-orange-500 rounded-full"></div>
                                        </div>

                                        <div className="flex items-center gap-4 text-gray-400">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 text-gray-400 group-hover:text-orange-500 transition-colors">
                                                <Eye className="w-5 h-5" />
                                            </div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">Monitoring incoming message payload for real-time rendering adjustments.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${showPreview ? 'bg-orange-500 text-black shadow-orange-500/20' : 'bg-black text-white hover:bg-gray-800 shadow-black/10'}`}
                                    >
                                        {showPreview ? <><EyeOff className="w-4 h-4" /> Edit Transmission</> : <><Eye className="w-4 h-4" /> Verify Visual Layout</>}
                                    </button>
                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center px-6">Render visual confirmation before final dispatch authorization.</p>
                                </div>
                            </div>

                            {/* Card 3: Message Protocol Editor */}
                            <div className="bg-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden relative flex flex-col justify-between min-h-[500px]">
                                <div className="p-10 space-y-8 flex-1 flex flex-col">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-6 flex items-center gap-2">
                                            <Paperclip className="w-3 h-3 text-orange-500" /> Subject Header
                                        </label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="w-full px-10 py-7 bg-gray-50 rounded-[2.5rem] font-black text-gray-900 border-2 border-transparent focus:border-black/5 focus:bg-white transition-all outline-none text-xl shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-4 flex-1 flex flex-col">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-6">Communication Payload</label>
                                        <div className="relative flex-1">
                                            {showPreview ? (
                                                <div className="absolute inset-0 bg-gray-50/50 p-8 rounded-[3rem] border border-gray-100 overflow-y-auto animate-in fade-in zoom-in duration-300">
                                                    {/* Elite Mini Preview Wrapper */}
                                                    <div className="max-w-md mx-auto bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 scale-90 origin-top">
                                                        <div className="bg-black py-8 px-6 text-center">
                                                            {invoice.logo_url ? <img src={invoice.logo_url} alt="Logo" className="h-8 mx-auto" /> : <div className="text-white font-black text-lg italic tracking-tighter">FlapaPay.</div>}
                                                        </div>
                                                        <div className="p-8 space-y-6">
                                                            <div className="space-y-3">
                                                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Client Payload View</p>
                                                                <p className="text-gray-900 font-bold text-base leading-relaxed whitespace-pre-wrap">{message}</p>
                                                            </div>
                                                            <div className="bg-black rounded-2xl p-6 text-center shadow-lg shadow-black/20">
                                                                <div className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-2">Secure Link Integrated</div>
                                                                <div className="text-white/30 text-[8px] font-mono break-all">{window.location.origin}/pay/inv/{invoice.id}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    className="w-full h-full p-10 rounded-[3rem] bg-gray-50 border-transparent focus:border-orange-500/10 focus:bg-white text-gray-900 font-bold text-lg transition-all outline-none resize-none shadow-inner leading-relaxed"
                                                    placeholder="Synthesizing transmission content..."
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50/50 flex items-center justify-between border-t border-gray-50 rounded-b-[3rem]">
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-lg shadow-orange-100/20">
                                            <Paperclip className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-sm border-b-2 border-emerald-400/30">Invoice-{invoice.invoice_number}.pdf</p>
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Verification Passed</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block text-[9px] font-black text-gray-300 uppercase tracking-widest">Resend API v2.0 READY</div>
                                </div>
                            </div>

                            {/* Card 4: Dispatch Authority Console */}
                            <div className="bg-black rounded-[4.5rem] p-12 text-white shadow-3xl shadow-black/40 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full -mr-40 -mt-40 blur-3xl opacity-50"></div>
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -ml-40 -mb-40 blur-3xl opacity-20"></div>

                                <div className="relative z-10 space-y-12">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] flex items-center gap-3">
                                            <ShieldCheck className="w-3 h-3 text-orange-500" /> Dispatch Authority Node
                                        </h3>

                                        <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 space-y-10">
                                            <div className="space-y-4">
                                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">Total Settlement Value</p>
                                                <p className="text-5xl font-black leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/30">
                                                    {invoice.currency} {parseFloat(invoice.total_amount).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Encryption</p>
                                                    <div className="flex items-center gap-3 text-emerald-400 font-black text-xs">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        AES-256
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Protocol</p>
                                                    <div className="text-orange-400 font-black text-xs uppercase tracking-widest">SMTP / SECURE</div>
                                                </div>
                                            </div>

                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full w-full bg-gradient-to-r from-orange-600 via-orange-500 to-white/20 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <button
                                            onClick={handleSend}
                                            disabled={sending}
                                            className="w-full py-10 bg-orange-500 text-black rounded-[2.5rem] font-black text-base uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all hover:bg-orange-400 hover:scale-[1.03] active:scale-[0.98] shadow-[0_32px_64px_-16px_rgba(249,115,22,0.4)] disabled:opacity-50 group border-4 border-orange-300/20"
                                        >
                                            {sending ? (
                                                <>
                                                    <div className="h-6 w-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                                                    Executing...
                                                </>
                                            ) : (
                                                <>
                                                    Authorize Dispatch
                                                    <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        <div className="flex items-center justify-center gap-4 text-[10px] text-white/20 font-black uppercase tracking-[0.5em]">
                                            <CheckCircle2 className="w-4 h-4" /> Final Audit Confirmed
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 pt-10 mt-10 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 opacity-40">
                                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <p className="text-[9px] font-bold text-white uppercase tracking-widest">Audit Trail Logged</p>
                                        </div>
                                        <div className="text-[9px] font-black text-white/20 tracking-tighter italic">v2.4.0-PRO</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    )}
                </main>
            </div>
        </div>
    );
};
