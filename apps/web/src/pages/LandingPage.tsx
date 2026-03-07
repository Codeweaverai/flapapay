import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/sections/Hero';
import { Stats } from '../components/sections/Stats';
import { Features } from '../components/sections/Features';
import { CTA } from '../components/sections/CTA';
import { ValueProposition } from '../components/sections/ValueProposition';
import { EmailTransferSection } from '../components/sections/EmailTransferSection';
import { VirtualCardShowcase } from '../components/sections/VirtualCardShowcase';
import { FXLiquiditySection } from '../components/sections/FXLiquiditySection';
import { BusinessSolutions } from '../components/sections/BusinessSolutions';
import { MobileAppSection } from '../components/sections/MobileAppSection';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
            <Navbar />

            <main>
                <Hero />
                <ValueProposition />
                <EmailTransferSection />
                <VirtualCardShowcase />
                <FXLiquiditySection />
                <BusinessSolutions />
                <MobileAppSection />
                <Stats />
                <Features />
                <CTA />
            </main>

            <Footer />
        </div>
    );
};
