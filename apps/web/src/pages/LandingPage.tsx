import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { CTA } from '../components/sections/CTA';
import { ValueProposition } from '../components/sections/ValueProposition';
import { VirtualCardShowcase } from '../components/sections/VirtualCardShowcase';
import { FXLiquiditySection } from '../components/sections/FXLiquiditySection';
import { BusinessSolutions } from '../components/sections/BusinessSolutions';
import { MobileAppShowcase } from '../components/sections/MobileAppShowcase';
import { HostedCheckoutShowcase } from '../components/sections/HostedCheckoutShowcase';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
            <Navbar />

            <main>
                <Hero />
                <ValueProposition />
                <VirtualCardShowcase />
                <FXLiquiditySection />
                <BusinessSolutions />
                <HostedCheckoutShowcase />
                <MobileAppShowcase />
                <Features />
                <CTA />
            </main>

            <Footer />
        </div>
    );
};
