import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Sidebar } from '../components/layout/Sidebar';
import {
    Plus, Trash2, ArrowLeft, Save,
    Send, Eye, Image as ImageIcon,
    Calendar,
    Zap, Tag, Receipt, Check
} from 'lucide-react';

interface InvoiceItem {
    description: string;
    quantity: number;
    price: number;
    amount: number;
}

export const CreateInvoice: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const [, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
    const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
    const [dueDate, setDueDate] = useState<Date | null>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
    const [currency, setCurrency] = useState('USD');
    const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, price: 0, amount: 0 }]);
    const [taxRate, setTaxRate] = useState<number>(16);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [allowsInstallments, setAllowsInstallments] = useState(false);

    // Branding State
    const [logoUrl, setLogoUrl] = useState('');
    const [brandColor, setBrandColor] = useState('#000000');
    const [terms, setTerms] = useState('Payment is due within 7 days. Thank you for your business.');
    const [senderName, setSenderName] = useState('');
    const [senderAddress, setSenderAddress] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [status, setStatus] = useState<string>('DRAFT');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchInvoice(id!);
        }
    }, [id]);

    const fetchInvoice = async (invoiceId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/v1/invoices/${invoiceId}`);
            const data = response.data;
            setClientName(data.client_name);
            setClientEmail(data.client_email);
            setClientAddress(data.client_address || '');
            setInvoiceNumber(data.invoice_number || '');
            setInvoiceDate(data.invoice_date ? new Date(data.invoice_date) : new Date());
            setDueDate(data.due_date ? new Date(data.due_date) : new Date());
            setCurrency(data.currency);
            setLogoUrl(data.logo_url || '');
            setBrandColor(data.brand_color || '#000000');
            setTerms(data.terms_conditions || '');
            setTaxRate(parseFloat(data.tax_rate) || 16);
            setDiscountAmount(parseFloat(data.discount_amount) || 0);
            setAllowsInstallments(data.allows_installments || false);
            if (data.scheduled_at) setScheduledAt(new Date(data.scheduled_at));
            setSenderName(data.sender_name || '');
            setSenderAddress(data.sender_address || '');
            setSenderPhone(data.sender_phone || '');
            setStatus(data.status);

            setItems(data.items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                price: parseFloat(item.price),
                amount: parseFloat(item.amount)
            })));
        } catch (error) {
            console.error('Failed to fetch invoice:', error);
            navigate('/invoices');
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.price), 0), [items]);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, price: 0, amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        if (field === 'quantity' || field === 'price') {
            newItems[index].amount = newItems[index].quantity * newItems[index].price;
        }
        setItems(newItems);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/v1/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLogoUrl(`http://localhost:3005${response.data.url}`);
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async () => {
        if (!isEditMode) return;
        setLoading(true);
        try {
            await api.post(`/v1/invoices/${id}/approve`);
            setStatus('APPROVED');
            navigate('/invoices');
        } catch (error: any) {
            console.error(error);
            alert('Error: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (isDraft: boolean = true) => {
        if (!clientName || !clientEmail) {
            alert('Please fill in at least the client name and email.');
            return;
        }
        setLoading(true);
        const payload = {
            clientName, clientEmail, clientAddress,
            invoiceNumber, invoiceDate, dueDate, currency, items,
            logoUrl, brandColor, terms,
            scheduledAt: !isDraft ? scheduledAt : null,
            senderName, senderAddress, senderPhone,
            taxRate, discountAmount, allowsInstallments
        };

        try {
            if (isEditMode) {
                await api.put(`/v1/invoices/${id}`, payload);
            } else {
                await api.post('/v1/invoices', payload);
            }
            navigate('/invoices');
        } catch (error: any) {
            console.error(error);
            alert('Error: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen z-40">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col h-screen relative overflow-x-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-orange-500/10 via-emerald-500/5 to-transparent rounded-full -mr-96 -mt-96 blur-3xl pointer-events-none z-0"></div>

                <div className="relative z-10 flex flex-col h-full overflow-hidden">
                    <header className="bg-white/60 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between px-12 py-8 shrink-0 z-20 shadow-sm sticky top-0">
                        <div className="flex items-center gap-8">
                            <button onClick={() => navigate('/invoices')} className="p-3.5 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-black hover:scale-110 active:scale-95 border border-transparent hover:border-gray-100 shadow-sm">
                                <ArrowLeft className="w-6 h-6 stroke-[2.5px]" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                    {isEditMode ? 'Edit Invoice' : 'New Transaction'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className={`h-2 w-2 rounded-full ${isEditMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        {isEditMode ? `Revision in Progress ${id?.slice(0, 8)}` : 'Initiating Financial Document'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="bg-white text-gray-500 border-2 border-gray-100 h-12 w-12 rounded-2xl flex items-center justify-center hover:text-black hover:border-gray-200 transition-all shadow-sm active:scale-95 group"
                                title="Preview Invoice"
                            >
                                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                className="bg-white text-gray-900 border-2 border-gray-100 px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center gap-3 shadow-sm active:scale-95"
                            >
                                <Save className="w-4 h-4 text-gray-400" />
                                {status === 'APPROVED' ? 'Update Invoice' : isEditMode ? 'Update Draft' : 'Store Draft'}
                            </button>

                            {isEditMode && status === 'DRAFT' && (
                                <button
                                    onClick={handleApprove}
                                    className="bg-emerald-500 text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95"
                                >
                                    <Check className="w-4 h-4" />
                                    Approve Invoice
                                </button>
                            )}
                            <button
                                onClick={() => handleSave(false)}
                                className="bg-black text-white px-12 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-all flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-95 group"
                            >
                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                {isEditMode ? 'Authorize & Update' : 'Initialize & Send'}
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto bg-[#F8F9FC] custom-scrollbar">
                        <div className="w-[95%] max-w-none mx-auto p-8 lg:p-12 space-y-16">
                            {/* Section: Client & Business */}
                            <div className="space-y-12">
                                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[48px] p-1 shadow-2xl shadow-orange-500/10 overflow-hidden transform hover:scale-[1.005] transition-transform duration-500">
                                    <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group space-y-10">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                                        <div className="relative z-10 space-y-10">
                                            <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4">
                                                    <div className="h-2.5 w-8 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]"></div>
                                                    Customer Identity
                                                </h2>
                                            </div>
                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div>
                                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Client Name / Business Name</label>
                                                        <input
                                                            type="text"
                                                            value={clientName}
                                                            onChange={e => setClientName(e.target.value)}
                                                            className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white focus:ring-[15px] focus:ring-black/[0.03] outline-none transition-all font-black text-gray-900 text-lg placeholder:text-gray-200"
                                                            placeholder="Who are you billing?"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Electronic Mail Address</label>
                                                        <input
                                                            type="email"
                                                            value={clientEmail}
                                                            onChange={e => setClientEmail(e.target.value)}
                                                            className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white focus:ring-[15px] focus:ring-black/[0.03] outline-none transition-all font-black text-gray-900 text-lg placeholder:text-gray-200"
                                                            placeholder="client@hq.com"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Physical / Billing Address</label>
                                                    <textarea
                                                        value={clientAddress}
                                                        onChange={e => setClientAddress(e.target.value)}
                                                        rows={2}
                                                        className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white focus:ring-[15px] focus:ring-black/[0.03] outline-none transition-all font-black text-gray-900 text-lg placeholder:text-gray-200 resize-none min-h-[120px]"
                                                        placeholder="Street address, City, Country"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Merchant Credentials Card */}
                                <div className="bg-blue-600 rounded-[48px] p-1 shadow-2xl shadow-blue-500/10 overflow-hidden transform hover:scale-[1.005] transition-transform duration-500">
                                    <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group space-y-10">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                                        <div className="relative z-10 space-y-10">
                                            <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4">
                                                    <div className="h-2.5 w-8 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]"></div>
                                                    Merchant Credentials
                                                </h2>
                                            </div>
                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div>
                                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Originator Name</label>
                                                        <input
                                                            type="text"
                                                            value={senderName}
                                                            onChange={e => setSenderName(e.target.value)}
                                                            className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white focus:ring-[15px] focus:ring-black/[0.03] outline-none transition-all font-black text-gray-900 text-lg placeholder:text-gray-200"
                                                            placeholder="Your Entity Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Primary Contact</label>
                                                        <input
                                                            type="text"
                                                            value={senderPhone}
                                                            onChange={e => setSenderPhone(e.target.value)}
                                                            className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white focus:ring-[15px] focus:ring-black/[0.03] outline-none transition-all font-black text-gray-900 text-lg placeholder:text-gray-200"
                                                            placeholder="+260 9..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                                                    <div className="md:col-span-8">
                                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Station Address</label>
                                                        <input
                                                            type="text"
                                                            value={senderAddress}
                                                            onChange={e => setSenderAddress(e.target.value)}
                                                            className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white focus:ring-[15px] focus:ring-black/[0.03] outline-none transition-all font-black text-gray-900 text-lg placeholder:text-gray-200"
                                                            placeholder="Town, Province"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4 self-end">
                                                        <label className="flex items-center gap-6 p-5.5 rounded-[2rem] bg-gray-50/80 hover:bg-white hover:shadow-xl transition-all cursor-pointer border-2 border-dashed border-gray-100 group">
                                                            <div className="h-16 w-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all">
                                                                {uploading ? <div className="w-6 h-6 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div> : <ImageIcon className="w-7 h-7" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Brand Mark</p>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">PNG / SVG</p>
                                                            </div>
                                                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Items Table */}
                            <div className="bg-violet-600 rounded-[48px] p-1 shadow-2xl shadow-violet-500/10 overflow-hidden">
                                <div className="bg-white rounded-[46px] relative overflow-hidden group flex flex-col">
                                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-50 rounded-full -ml-32 -mb-32 transition-transform duration-700 group-hover:scale-110"></div>
                                    <div className="relative z-10">
                                        <div className="p-12 border-b border-gray-50 flex justify-between items-center relative z-20">
                                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4">
                                                <div className="h-2.5 w-8 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.3)]"></div>
                                                Transaction Items
                                            </h2>
                                            <button onClick={handleAddItem} className="bg-black text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-gray-800 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-95">
                                                <Plus className="w-4 h-4" />
                                                Insert Item Row
                                            </button>
                                        </div>
                                        <div className="p-12">
                                            <div className="space-y-6">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="grid grid-cols-12 gap-8 items-center p-10 bg-gray-50/50 rounded-[2.5rem] border-2 border-transparent hover:border-black hover:bg-white transition-all group">
                                                        <div className="col-span-12 lg:col-span-6">
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3.5 ml-1">Product Description</label>
                                                            <input
                                                                value={item.description}
                                                                onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                                                className="w-full px-6 py-5 rounded-[1.5rem] bg-white border border-gray-100 focus:border-black outline-none font-black text-gray-900 transition-all text-xl shadow-sm placeholder:text-gray-100"
                                                                placeholder="e.g. Enterprise Cloud Deployment"
                                                            />
                                                        </div>
                                                        <div className="col-span-4 lg:col-span-2 text-center">
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3.5">Quanity</label>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="w-full px-6 py-5 rounded-[1.5rem] bg-white border border-gray-100 focus:border-black outline-none font-black text-gray-900 text-center transition-all text-xl shadow-sm"
                                                            />
                                                        </div>
                                                        <div className="col-span-6 lg:col-span-3">
                                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3.5">Unit Value</label>
                                                            <div className="relative">
                                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[11px] font-black text-gray-300">{currency}</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.price}
                                                                    onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                                                    className="w-full pl-16 pr-6 py-5 rounded-[1.5rem] bg-white border border-gray-100 focus:border-black outline-none font-black text-gray-900 transition-all text-xl shadow-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 lg:col-span-1 flex justify-center pt-8">
                                                            <button onClick={() => handleRemoveItem(idx)} className="h-14 w-14 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-[1.25rem] transition-all shadow-sm">
                                                                <Trash2 className="w-7 h-7" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Advanced Settings */}
                        <div className="max-w-5xl mx-auto space-y-16 mt-16 pb-20">
                            <div className="bg-[#1A1A1A] rounded-[48px] p-1 shadow-2xl shadow-gray-200 overflow-hidden transform hover:scale-[1.005] transition-transform duration-500 text-white">
                                <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group space-y-10 hover:border-white/20">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500 rounded-full -mr-32 -mt-32 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                    <div className="relative z-10 space-y-10 text-black">
                                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4 border-b border-gray-50 pb-8">
                                            <div className="h-2.5 w-8 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.3)]"></div>
                                            Schedule & Terms
                                        </h2>
                                        <div className="space-y-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Reference ID</label>
                                                    <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent outline-none font-black font-mono text-gray-900 text-lg focus:border-black focus:bg-white transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Settlement Currency</label>
                                                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent outline-none font-black text-gray-900 text-lg transition-all focus:border-black focus:bg-white cursor-pointer appearance-none">
                                                        <option value="USD">United States Dollar ($)</option>
                                                        <option value="ZMW">Zambian Kwacha (K)</option>
                                                        <option value="EUR">Euro (€)</option>
                                                        <option value="GBP">British Pound (£)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Effective Date</label>
                                                    <div className="relative">
                                                        <DatePicker selected={invoiceDate} onChange={(date: Date | null) => setInvoiceDate(date)} className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent outline-none font-black text-gray-900 text-lg focus:border-black focus:bg-white transition-all" />
                                                        <Calendar className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Closing Window</label>
                                                    <div className="relative">
                                                        <DatePicker selected={dueDate} onChange={(date: Date | null) => setDueDate(date)} className="w-full px-8 py-5.5 rounded-[2rem] bg-gray-50/50 border-2 border-transparent outline-none font-black text-gray-900 text-lg focus:border-black focus:bg-white transition-all" />
                                                        <Calendar className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-600 rounded-[48px] p-1 shadow-2xl shadow-emerald-500/10 overflow-hidden transform hover:scale-[1.005] transition-transform duration-500">
                                <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group space-y-10">
                                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-50 rounded-full -mr-32 -mb-32 transition-transform duration-700 group-hover:scale-110"></div>
                                    <div className="relative z-10 space-y-10">
                                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4 border-b border-gray-50 pb-8">
                                            <div className="h-2.5 w-8 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.3)]"></div>
                                            Fiscal Adjustments
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="flex items-center gap-10 p-10 bg-gray-50/50 rounded-[2.5rem] border-2 border-transparent hover:border-emerald-200 hover:bg-white transition-all shadow-sm">
                                                <div className="h-20 w-20 bg-white rounded-[1.5rem] shadow-md flex items-center justify-center text-emerald-500 border border-gray-50">
                                                    <Receipt className="w-10 h-10" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">VAT Percentage (%)</p>
                                                    <input
                                                        type="number"
                                                        value={taxRate}
                                                        onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-0 p-0 text-4xl font-black text-gray-900 outline-none placeholder:text-gray-100"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-10 p-10 bg-gray-50/50 rounded-[2.5rem] border-2 border-transparent hover:border-rose-200 hover:bg-white transition-all shadow-sm">
                                                <div className="h-20 w-20 bg-white rounded-[1.5rem] shadow-md flex items-center justify-center text-rose-500 border border-gray-50">
                                                    <Tag className="w-10 h-10" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Rebate / Discount ({currency})</p>
                                                    <input
                                                        type="number"
                                                        value={discountAmount}
                                                        onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-0 p-0 text-4xl font-black text-gray-900 outline-none placeholder:text-gray-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-600 rounded-[48px] p-1 shadow-2xl shadow-indigo-500/10 overflow-hidden transform hover:scale-[1.005] transition-transform duration-500">
                                <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group space-y-10">
                                    <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-50 rounded-full -ml-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                                    <div className="relative z-10 space-y-10">
                                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4 border-b border-gray-50 pb-8">
                                            <div className="h-2.5 w-8 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.3)]"></div>
                                            Payment Policy
                                        </h2>
                                        <div className="flex items-center justify-between p-10 bg-gray-50/50 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
                                            <div className="flex items-center gap-10">
                                                <div className="h-20 w-20 bg-white rounded-[1.5rem] shadow-md flex items-center justify-center text-indigo-500 border border-gray-50">
                                                    <Zap className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Partial Payments</p>
                                                    <p className="text-xl font-black text-gray-900">Enable Installments</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">Allow client to pay in multiple sessions</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setAllowsInstallments(!allowsInstallments)}
                                                className={`w-20 h-10 rounded-full transition-all relative ${allowsInstallments ? 'bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-lg transition-all ${allowsInstallments ? 'left-11' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal Backdrop */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 lg:p-20">
                    <div className="absolute inset-0 bg-[#0A0C10]/95 backdrop-blur-2xl" onClick={() => setShowPreview(false)}></div>

                    <div className="relative w-full max-w-2xl h-full flex flex-col animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute -top-12 right-0 text-white/40 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exit Preview</span>
                            <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/20">
                                <Plus className="w-4 h-4 rotate-45" />
                            </div>
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-white border border-white/10">
                            <div className="p-10 md:p-16 flex flex-col min-h-full">
                                <div className="flex justify-between items-start mb-16">
                                    <div className="max-w-[240px]">
                                        {logoUrl ? <img src={logoUrl} className="h-16 mb-8 object-contain" /> : <div className="h-16 w-16 bg-gray-100 rounded-2xl mb-8"></div>}
                                        <h3 className="text-5xl font-black text-gray-900 tracking-tighter">INVOICE</h3>
                                        <p className="text-[10px] font-black text-gray-300 font-mono mt-3 uppercase tracking-[0.2em]">NO. <span className="text-gray-900">{invoiceNumber}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-8">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Cycle Opening</p>
                                            <p className="text-sm font-black text-gray-900">{invoiceDate?.toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Cycle Closing</p>
                                            <p className="text-sm font-black text-gray-900">{dueDate?.toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-16 mb-16">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4 border-b border-gray-50 pb-2">Originator</p>
                                        <p className="text-sm font-black text-gray-900 uppercase">{senderName || 'Your Business'}</p>
                                        <p className="text-xs font-bold text-gray-400 mt-2">{senderPhone}</p>
                                        <p className="text-xs font-bold text-gray-300 mt-4 italic leading-relaxed">{senderAddress}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4 border-b border-gray-50 pb-2">Counterparty</p>
                                        <p className="text-sm font-black text-gray-900 uppercase">{clientName || 'Client Entity'}</p>
                                        <p className="text-xs font-bold text-gray-400 mt-2">{clientEmail}</p>
                                        <p className="text-xs font-bold text-gray-300 mt-4 leading-relaxed">{clientAddress}</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="grid grid-cols-12 gap-6 border-b-[3px] border-black pb-5 mb-6">
                                        <p className="col-span-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Line Ledger</p>
                                        <p className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">Qty</p>
                                        <p className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] text-right">Value</p>
                                    </div>
                                    <div className="space-y-6">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-6 items-center">
                                                <div className="col-span-8">
                                                    <p className="text-sm font-black text-gray-900 mb-1">{item.description || 'System Provision'}</p>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{currency} {item.price.toLocaleString()}</p>
                                                </div>
                                                <p className="col-span-2 text-sm font-black text-gray-900 text-center">{item.quantity}</p>
                                                <p className="col-span-2 text-sm font-black text-gray-900 text-right">{currency} {(item.quantity * item.price).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-16 space-y-4 border-t-2 border-gray-100 pt-10">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Gross Subtotal</p>
                                        <p className="text-sm font-black">{currency} {subtotal.toLocaleString()}</p>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-rose-500">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Partner Rebate</p>
                                            <p className="text-sm font-black">-{currency} {discountAmount.toLocaleString()}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-gray-500">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Value Added Tax ({taxRate}%)</p>
                                        <p className="text-sm font-black">{currency} {taxAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-8 border-t-[4px] border-black mt-8">
                                        <p className="text-xs font-black text-black uppercase tracking-[0.5em]">Final Settlement</p>
                                        <p className="text-4xl font-black text-black tracking-tighter">{currency} {totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-16 pt-10 border-t border-gray-50">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Terms & Conditions</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed tracking-widest">{terms}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
