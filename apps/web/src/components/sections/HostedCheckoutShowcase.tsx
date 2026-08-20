import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HostedCheckoutShowcase: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="hosted-checkout" className="bg-white py-12">
            <div className="w-full">
                <img
                    src="/assets/images/hosted-checkout-showcase.png"
                    alt="FlapaPay hosted checkout experience for merchants"
                    className="block w-full h-auto"
                    loading="lazy"
                />
            </div>

            <div className="mt-8 flex justify-center px-6">
                <button
                    onClick={() => navigate('/merchant/signup')}
                    className="rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95"
                >
                    Start Selling
                </button>
            </div>
        </section>
    );
};
