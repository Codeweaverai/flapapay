import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 py-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
                    {/* Logo & Info */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link to="/" className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-8">
                            <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="w-10 h-10" />
                            FlapaPay
                        </Link>
                        <p className="text-gray-500 max-w-xs mb-8 text-lg font-medium leading-relaxed">
                            Global financial infrastructure for the next generation of commerce. Direct integrations with MNOs and banks across 50+ countries.
                        </p>
                        <div className="flex gap-4">
                            {['Twitter', 'LinkedIn', 'Instagram'].map((social, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                                    <span className="sr-only">{social}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <h4 className="font-black text-gray-900 mb-8 uppercase tracking-widest text-sm">Products</h4>
                        <div className="space-y-4">
                            <Link to="/payments-overview" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Payments</Link>
                            <Link to="/collections" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Collections</Link>
                            <Link to="/invoicing" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Invoicing</Link>
                            <Link to="/qr-payments" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">QR Payments</Link>
                            <Link to="/payouts" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Payouts</Link>
                            <Link to="/teams" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Teams</Link>
                            <Link to="/pay-links-overview" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Payment Links</Link>
                            <Link to="/pos-systems" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">POS Systems</Link>
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-black text-gray-900 mb-8 uppercase tracking-widest text-sm">Company</h4>
                        <div className="space-y-4">
                            <Link to="/about" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">About Us</Link>
                            <Link to="/careers" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Careers</Link>
                            <Link to="/customers" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Customers</Link>
                            <Link to="/blog" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Blog</Link>
                            <Link to="/merchant-service-agreement" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Merchant Service Agreement</Link>
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-black text-gray-900 mb-8 uppercase tracking-widest text-sm">Resources</h4>
                        <div className="space-y-4">
                            <Link to="/help" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Help Center</Link>
                            <Link to="/documentation" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Documentation</Link>
                            <Link to="/security" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Security</Link>
                            <Link to="/cookies" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Cookie Policy</Link>
                            <Link to="/privacy" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="block text-gray-500 hover:text-orange-500 font-bold transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-24 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-400 font-bold">© 2026 FlapaPay Inc. All rights reserved.</p>
                    <p className="text-gray-400 font-bold">FlapaPay is a financial technology company, not a bank.</p>
                </div>
            </div>
        </footer>
    );
};
