'use client';

import React, { useState } from 'react';
import SmoothScroll from './motion/SmoothScroll';
import Preloader from './sections/Preloader';
import HeroSection from './sections/HeroSection';
import LiveSocialProof from './sections/LiveSocialProof';
import ValueNarrative from './sections/ValueNarrative';
import FeatureBento from './sections/FeatureBento';
import ShowcaseGallery from './sections/ShowcaseGallery';
import PricingMatrix from './sections/PricingMatrix';
import FAQAccordion from './sections/FAQAccordion';
import HighContrastCTA from './sections/HighContrastCTA';

export default function AwwardsLandingPage() {
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  return (
    <SmoothScroll>
      {/* Modern Curtain Preloader */}
      <Preloader onComplete={() => setPreloaderFinished(true)} />

      <div className="w-full text-slate-900 transition-colors duration-300 dark:text-white selection:bg-cyan-500 selection:text-black">
        {/* Hero Section with Interactive Particle Canvas & Live Telemetry Board */}
        <HeroSection
          brandName="SysMaira Enterprise"
          subheadline="We architect and build resilient digital platforms, high-concurrency cloud systems, and connected web ecosystems powered by PostgreSQL and Next.js."
        />

        {/* Live Social Proof / Verified Partner Marquee */}
        <LiveSocialProof />

        {/* Value Narrative / 6-Phase Delivery Architecture */}
        <ValueNarrative />

        {/* Services & Engineering Capabilities Bento Grid */}
        <FeatureBento />

        {/* Showcase Gallery / Production Case Studies */}
        <ShowcaseGallery />

        {/* Pricing Matrix, Production Tiers & Live Coupon Engine */}
        <PricingMatrix />

        {/* Architectural FAQ Accordion */}
        <FAQAccordion />

        {/* High-Contrast Conversion CTA Banner with Verified Testimonials & CRM Lead Form */}
        <HighContrastCTA />
      </div>
    </SmoothScroll>
  );
}
