import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Globe2,
    Zap,
    ShieldCheck,
    CreditCard,
    ArrowRight
} from 'lucide-react';

const featuresArr = [
    {
        name: 'Global Payments',
        description: 'Accept payments from customers worldwide with a single integration.',
        icon: <Globe2 className="w-8 h-8" />,
        path: '/dashboard',
        color: 'text-blue-500',
        bg: 'bg-blue-50 border-blue-100',
        accent: 'bg-blue-500'
    },
    {
        name: 'Instant Payouts',
        description: 'Send funds to bank accounts and mobile wallets in seconds.',
        icon: <Zap className="w-8 h-8" />,
        path: '/withdraw',
        color: 'text-orange-500',
        bg: 'bg-orange-50 border-orange-100',
        accent: 'bg-orange-500'
    },
    {
        name: 'Fraud Protection',
        description: 'Machine learning powered fraud detection to keep your money safe.',
        icon: <ShieldCheck className="w-8 h-8" />,
        path: '/settings',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 border-emerald-100',
        accent: 'bg-emerald-500'
    },
    {
        name: 'Virtual Cards',
        description: 'Issue virtual USD cards for your team or customers instantly.',
        icon: <CreditCard className="w-8 h-8" />,
        path: '/virtual-cards',
        color: 'text-purple-500',
        bg: 'bg-purple-50 border-purple-100',
        accent: 'bg-purple-500'
    }
];

export const Features: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="features" className="py-32 bg-gray-50 relative overflow-hidden">
            {/* Minimalist Background Accents */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="mx-auto max-w-2xl text-center mb-20 text-balance">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black shadow-lg shadow-black/10 text-xs font-black text-white uppercase tracking-[0.2em] mb-8">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        Unified Platform
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black sm:text-7xl mb-6">
                        A complete <br />
                        <span className="text-orange-500">financial stack</span>
                    </h2>
                    <p className="mt-6 text-xl leading-relaxed text-gray-600 font-medium">
                        We handle the complexity of payments, licensing, and compliance so you can focus entirely on building your product.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuresArr.map((feature) => (
                        <div
                            key={feature.name}
                            onClick={() => navigate(feature.path)}
                            className="relative bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 cursor-pointer overflow-hidden isolate"
                        >
                            <div className={`w-16 h-16 rounded-[24px] ${feature.bg} flex items-center justify-center mb-8 border`}>
                                <div className={`${feature.color}`}>
                                    {React.cloneElement(feature.icon as React.ReactElement, { className: 'w-7 h-7' })}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">{feature.name}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium mb-8">
                                {feature.description}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-widest mt-auto">
                                <span>Explore</span>
                                <ArrowRight className="w-4 h-4 text-orange-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
