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
        color: 'text-blue-300'
    },
    {
        name: 'Instant Payouts',
        description: 'Send funds to bank accounts and mobile wallets in seconds.',
        icon: <Zap className="w-8 h-8" />,
        path: '/withdraw',
        color: 'text-orange-300'
    },
    {
        name: 'Fraud Protection',
        description: 'Machine learning powered fraud detection to keep your money safe.',
        icon: <ShieldCheck className="w-8 h-8" />,
        path: '/settings',
        color: 'text-emerald-300'
    },
    {
        name: 'Virtual Cards',
        description: 'Issue virtual USD cards for your team or customers instantly.',
        icon: <CreditCard className="w-8 h-8" />,
        path: '/virtual-cards',
        color: 'text-purple-300'
    }
];

export const Features: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="features" className="relative overflow-hidden bg-[#050505] py-32 text-white">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_82%_18%,_rgba(245,158,11,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_30%)]" />
                <div className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-orange-500/14 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-6rem] right-[4%] h-96 w-96 rounded-full bg-orange-400/14 blur-[120px] animate-pulse" style={{ animationDelay: '1.6s' }} />
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: 'linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto mb-20 max-w-2xl text-center text-balance">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-200 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse"></span>
                        Unified Platform
                    </div>
                    <h2 className="mb-6 text-4xl font-black tracking-tight text-white sm:text-7xl md:text-6xl">
                        A complete <br />
                        <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-orange-400 bg-clip-text text-transparent">financial stack</span>
                    </h2>
                    <p className="mt-6 text-xl font-medium leading-relaxed text-amber-50/75">
                        We handle the complexity of payments, licensing, and compliance so you can focus entirely on building your product.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {featuresArr.map((feature) => (
                        <div
                            key={feature.name}
                            onClick={() => navigate(feature.path)}
                            className="group relative isolate cursor-pointer overflow-hidden rounded-[32px] border border-white/10 bg-white/8 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-amber-300/30 hover:bg-white/12"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-gradient-to-br from-white/14 to-white/6 shadow-lg">
                                <div className={feature.color}>
                                    {React.cloneElement(feature.icon as React.ReactElement, { className: 'w-7 h-7' })}
                                </div>
                            </div>

                            <h3 className="mb-4 text-xl font-black tracking-tight text-white">{feature.name}</h3>
                            <p className="mb-8 text-sm font-medium leading-relaxed text-white/65">
                                {feature.description}
                            </p>

                            <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-200">
                                <span>Explore</span>
                                <ArrowRight className="w-4 h-4 text-orange-300 transition-transform duration-300 group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
