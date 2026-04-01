"use client"

import { PublicHeader } from "./public-header"
import { HeroSection } from "./hero-section"
import { BenefitsSection } from "./benefits-section"
import { RgpdSection } from "./rgpd-section"
import { MobileAppSection } from "./mobile-app-section"
import { ProfessionalCtaSection } from "./professional-cta-section"
import { PublicFooter } from "./public-footer"

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main>
        <HeroSection />
        <BenefitsSection />
        <RgpdSection />
        <MobileAppSection />
        <ProfessionalCtaSection />
      </main>
      <PublicFooter />
    </div>
  )
}
