import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import {
    CreditCard,
    Link as LinkIcon,
    Send,
    Users,
    ChevronRight,
    ArrowRight,
    Rocket
} from 'lucide-react';

const features = [
    {
        title: "Collections",
        description: "Receive payments from your customers through card, mobile money, and bank transfer.",
        icon: <CreditCard className="w-8 h-8" />,
        link: "/collections",
        colorText: 'text-blue-500',
        colorBg: 'bg-blue-50 border-blue-100',
    },
    {
        title: "Payment Link",
        description: "Use payment links to collect payments from your customers with ease. Sell online or manage invoices with zero code.",
        icon: <LinkIcon className="w-8 h-8" />,
        link: "/pay-links-overview",
        colorText: 'text-orange-500',
        colorBg: 'bg-orange-50 border-orange-100',
    },
    {
        title: "Payouts",
        description: "Make up to 5,000 payouts to Mobile money wallets or Bank accounts instantly. Upload files or integrate our robust API.",
        icon: <Send className="w-8 h-8" />,
        link: "/payouts",
        colorText: 'text-emerald-500',
        colorBg: 'bg-emerald-50 border-emerald-100',
    },
    {
        title: "Team Members",
        description: "Supercharge your workforce. Add your entire team for seamless management, reconciliation and notifications.",
        icon: <Users className="w-8 h-8" />,
        link: "/teams",
        colorText: 'text-purple-500',
        colorBg: 'bg-purple-50 border-purple-100',
    }
];

export const ValueProposition: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="py-32 bg-white relative overflow-hidden">
            {/* Subtle background texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Why FlapaPay
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-[0.9]">
                        Built for African businesses that need <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500">faster, smarter money movement.</span>
                    </h2>
                    <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
                        FlapaPay helps businesses collect payments, send payouts, manage customer billing, and move money across channels from one modern platform. We focus on speed, operational control, and practical financial tools that help African companies scale with less friction.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(feature.link)}
                            className="group relative bg-white rounded-[48px] p-10 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 cursor-pointer flex flex-col h-full overflow-hidden isolate"
                        >
                            <div className={`w-20 h-20 rounded-[30px] ${feature.colorBg} flex items-center justify-center mb-8 border transition-transform duration-500 shadow-sm group-hover:scale-105`}>
                                <div className={`${feature.colorText}`}>
                                    {feature.icon}
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
                            <p className="text-gray-500 mb-10 leading-relaxed text-sm font-medium flex-grow">
                                {feature.description}
                            </p>

                            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${feature.colorText}`}>
                                <span>Learn More</span>
                                <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Impact CTA */}
                <div className="mt-32 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-[64px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative bg-[#0A0A0A] rounded-[56px] p-12 lg:p-20 overflow-hidden shadow-2xl">
                        {/* Abstract glow */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-orange-400 uppercase tracking-widest mb-6">
                                    <Rocket className="w-3 h-3" /> Get Started Now
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                                    Ready to revolutionize your business payments?
                                </h3>
                                <p className="text-white/50 text-lg font-medium max-w-md">
                                    Join thousands of businesses scaling across Africa with FlapaPay's unified technology.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 lg:justify-end">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="px-12 py-6 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl font-black shadow-2xl shadow-orange-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 group/main"
                                >
                                    Start Now
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </button>
                                <button
                                    onClick={() => window.location.href = 'mailto:sales@flapapay.com'}
                                    className="px-12 py-6 bg-white/5 hover:bg-white/10 text-white rounded-3xl font-black border border-white/10 active:scale-95 transition-all text-sm uppercase tracking-widest backdrop-blur-sm"
                                >
                                    Talk to Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
