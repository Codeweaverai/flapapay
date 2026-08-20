import React from 'react';

export const MobileAppShowcase: React.FC = () => {
    return (
        <section id="mobile-app" className="bg-[#f4efe7] py-14">
            <div className="px-6 lg:px-8">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                        Mobile Banking Reimagined
                    </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
                    <img
                        src="/assets/images/flapapay-dashboard-showcase.png"
                        alt="FlapaPay dashboard experience"
                        className="block w-full h-auto"
                        loading="lazy"
                    />
                </div>
            </div>
        </section>
    );
};
