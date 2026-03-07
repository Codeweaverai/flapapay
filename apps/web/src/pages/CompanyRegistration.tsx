import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';

export const CompanyRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Mock file upload processing - in production this would upload to S3/Cloudinary
        // and return the URL. Here we just mock it.
        const mockDocuments = [
            { type: 'INCORPORATION', fileName: 'cert_incorp.pdf' },
            { type: 'DIRECTOR_ID', fileName: 'director_id.jpg' }
        ];

        try {
            await api.post('/merchants/compliance', {
                legalName: 'FlapaPay Mock Merchant', // In real app, from step 1 state
                registrationNumber: 'PACRA-123456',
                taxId: '1001999999',
                documents: mockDocuments
            });

            setStep(step + 1);
        } catch (err) {
            console.error('Compliance submission failed', err);
            alert('Failed to submit documents. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900">Compliance & KYC</h1>
                        <p className="text-gray-500 mt-2">Verify your business to unlock live payments and higher limits.</p>
                    </header>

                    {/* Progress Stepper */}
                    <div className="flex items-center mb-10">
                        {[
                            { id: 1, label: 'Business Details' },
                            { id: 2, label: 'Documents' },
                            { id: 3, label: 'Review' }
                        ].map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={`flex items-center gap-2 ${step >= s.id ? 'text-orange-600' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= s.id ? 'border-orange-600 bg-orange-50' : 'border-gray-200 bg-transparent'}`}>
                                        {step > s.id ? '✓' : s.id}
                                    </div>
                                    <span className="font-medium text-sm">{s.label}</span>
                                </div>
                                {i < 2 && <div className={`h-0.5 w-16 mx-4 ${step > s.id ? 'bg-orange-600' : 'bg-gray-200'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        {step === 1 && (
                            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">Business Registry Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Legal Business Name</label>
                                        <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. FlapaPay Limited" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Registration Number (PACRA/CAC)</label>
                                        <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="123456789" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tax ID (TPIN)</label>
                                        <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="1001..." required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Incorporation Date</label>
                                        <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" required />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" size="lg">Continue to Documents</Button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleUpload} className="space-y-8">
                                <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>

                                <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer">
                                    <div className="text-4xl mb-4">📄</div>
                                    <h3 className="font-bold text-gray-900 mb-1">Certificate of Incorporation</h3>
                                    <p className="text-sm text-gray-500">PDF, JPG or PNG (Max 5MB)</p>
                                    <input type="file" className="hidden" />
                                </div>

                                <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer">
                                    <div className="text-4xl mb-4">🆔</div>
                                    <h3 className="font-bold text-gray-900 mb-1">Director's ID / Passport</h3>
                                    <p className="text-sm text-gray-500">Front and Back</p>
                                    <input type="file" className="hidden" />
                                </div>

                                <div className="pt-4 flex justify-between">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                                    <Button type="submit" size="lg" disabled={isLoading}>
                                        {isLoading ? 'Uploading...' : 'Submit for Review'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                                    🔍
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
                                <p className="text-gray-500 max-w-md mx-auto mb-8">
                                    We've received your documents. Our compliance team will review them within 24 hours. You can still use Sandbox mode in the meantime.
                                </p>
                                <Button onClick={() => navigate('/merchant/dashboard')}>Return to Dashboard</Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
