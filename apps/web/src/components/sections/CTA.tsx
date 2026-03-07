import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const CTA: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-black relative overflow-hidden">
            {/* Top Angle */}
            <div className="absolute top-0 inset-x-0 h-16 bg-white origin-top-right -skew-y-1"></div>

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
        </div>
    );
};
