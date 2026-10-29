// frontend/components/landing/LandingSectionRegistry.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import LandingHero from './LandingHero';

// Below-the-fold sections code-split dynamically to reduce initial bundle & execution overhead
const TrustAndSocialProof = dynamic(() => import('./TrustAndSocialProof'));
const ProblemAndSolution = dynamic(() => import('./ProblemAndSolution'));
const FeaturesAndBenefits = dynamic(() => import('./FeaturesAndBenefits'));
const ProductShowcase = dynamic(() => import('./ProductShowcase'));
const HowItWorks = dynamic(() => import('./HowItWorks'));
const BenefitsAndDifferentiators = dynamic(() => import('./BenefitsAndDifferentiators'));
const ResultsAndCaseStudies = dynamic(() => import('./ResultsAndCaseStudies'));
const TestimonialsSection = dynamic(() => import('./TestimonialsSection'));
const PricingSection = dynamic(() => import('./PricingSection'));
const FAQSection = dynamic(() => import('./FAQSection'));
const FinalCTA = dynamic(() => import('./FinalCTA'));
const CustomHtmlSection = dynamic(() => import('./CustomHtmlSection'));

export interface DynamicSection {
  id: string;
  type: string;
  props: any;
  sortOrder?: number;
  cssClass?: string;
  animation?: string;
}

interface LandingSectionRegistryProps {
  sections?: DynamicSection[];
}

export default function LandingSectionRegistry({ sections }: LandingSectionRegistryProps) {
  // If no dynamic sections loaded yet, render default full landing suite
  if (!sections || !sections.length) {
    return (
      <>
        <LandingHero />
        <div className="content-auto"><TrustAndSocialProof /></div>
        <div className="content-auto"><ProblemAndSolution /></div>
        <div className="content-auto"><FeaturesAndBenefits /></div>
        <div className="content-auto"><ProductShowcase /></div>
        <div className="content-auto"><HowItWorks /></div>
        <div className="content-auto"><BenefitsAndDifferentiators /></div>
        <div className="content-auto"><ResultsAndCaseStudies /></div>
        <div className="content-auto"><TestimonialsSection /></div>
        <div className="content-auto"><PricingSection /></div>
        <div className="content-auto"><FAQSection /></div>
        <div className="content-auto"><FinalCTA /></div>
      </>
    );
  }

  // Render sections strictly according to API returned order and visibility
  return (
    <>
      {sections.map((sec, idx) => {
        const hasData = sec.props && typeof sec.props === 'object' && Object.keys(sec.props).length > 0;
        const data = hasData ? sec.props : undefined;

        // If Super Admin provided or customized HTML & Tailwind markup, render it directly
        if (sec.props?.custom_html && typeof sec.props.custom_html === 'string' && sec.props.custom_html.trim().length > 0) {
          return (
            <div key={sec.id} className={idx > 0 ? "content-auto" : undefined}>
              <CustomHtmlSection data={data} cssClass={sec.cssClass} />
            </div>
          );
        }

        const renderSection = () => {
          switch (sec.type) {
            case 'hero':
              return <LandingHero key={sec.id} data={data} />;
            case 'trust_proof':
            case 'trust':
              return <TrustAndSocialProof key={sec.id} data={data} />;
            case 'problem_solution':
              return <ProblemAndSolution key={sec.id} data={data} />;
            case 'features_benefits':
            case 'features':
              return <FeaturesAndBenefits key={sec.id} data={data} />;
            case 'showcase':
              return <ProductShowcase key={sec.id} data={data} />;
            case 'how_it_works':
              return <HowItWorks key={sec.id} data={data} />;
            case 'benefits_differentiators':
            case 'differentiators':
              return <BenefitsAndDifferentiators key={sec.id} data={data} />;
            case 'results_metrics':
            case 'case_studies':
              return <ResultsAndCaseStudies key={sec.id} data={data} />;
            case 'testimonials':
              return <TestimonialsSection key={sec.id} data={data} />;
            case 'pricing_models':
            case 'pricing':
              return <PricingSection key={sec.id} data={data} />;
            case 'faq':
              return <FAQSection key={sec.id} data={data} />;
            case 'final_cta':
            case 'cta':
              return <FinalCTA key={sec.id} data={data} />;
            case 'custom_html':
            case 'html_tailwind':
            case 'rich_text':
            case 'content':
              return <CustomHtmlSection key={sec.id} data={data} cssClass={sec.cssClass} />;
            default:
              return null;
          }
        };

        if (sec.type === 'hero' || idx === 0) {
          return renderSection();
        }

        return (
          <div key={sec.id} className="content-auto">
            {renderSection()}
          </div>
        );
      })}
    </>
  );
}
