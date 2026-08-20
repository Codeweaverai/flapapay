import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const CTA: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="bg-[#050505] relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute -top-24 left-[12%] h-72 w-72 rounded-full bg-orange-500/10 blur-[100px] animate-pulse"></div>
                <div className="absolute -bottom-24 right-[10%] h-80 w-80 rounded-full bg-orange-400/8 blur-[120px] animate-pulse" style={{ animationDelay: '1.8s' }}></div>
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: 'linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                ></div>
            </div>

            <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8 relative z-10">
                <div className="px-6 py-24 text-center">
                    <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to get started?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                        Join thousands of businesses sending payments across Africa with FlapaPay.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Button
                            size="lg"
                            onClick={() => navigate('/signup')}
                            className="shadow-[var(--shadow-stripe)]"
                        >
                            Create account
                        </Button>
                        <a href="mailto:sales@flapapay.com" className="text-sm font-semibold leading-6 text-white hover:text-[var(--color-primary)] transition-colors">
                            Contact Sales <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};
