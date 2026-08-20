import React from 'react';

export const FXLiquiditySection: React.FC = () => {
    return (
        <section className="bg-[#050505] py-16">
            <div className="px-6 lg:px-8">
                <div className="mx-auto mb-10 max-w-3xl text-center">
                    <div className="mb-5 inline-flex items-center rounded-full border border-orange-400/20 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-orange-300 backdrop-blur-md">
                        FX Liquidity
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                        Cross-border treasury visibility in one FX surface.
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
                        Track liquidity, monitor balances, and manage conversions from a single operating view designed for modern African businesses.
                    </p>
                </div>

                <div className="mx-auto max-w-[90rem] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
                    <div className="mb-3 flex items-center gap-2 px-3 pt-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0b0b0b]">
                        <img
                            src="/assets/images/fx-liquidity-showcase.png"
                            alt="FlapaPay FX liquidity dashboard"
                            className="block w-full h-auto"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
