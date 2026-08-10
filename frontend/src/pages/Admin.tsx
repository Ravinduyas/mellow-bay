import React from 'react';
import { IMAGES } from '../assets/images';
import { AdminPricing } from '../booking/AdminPricing';
import { PageHero } from '../components/PageHero';
import { Slab } from '../components/Slab';

export const Admin: React.FC = () => (
  <>
    <PageHero
      eyebrow="Admin"
      title="Price management"
      intro="Base prices, margins and lesson rates for the booking engine."
      image={IMAGES.coworkingDesks}
      imageAlt="Desks in the coworking space"
    />

    <Slab>
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-9 md:px-14">
        {/* This page is unlinked but not protected — anything genuinely
            sensitive needs a real auth check on a real backend. */}
        <div className="mb-6 rounded-[16px] border border-mail/30 bg-mail/5 p-4">
          <p className="text-[11px] leading-relaxed text-ink">
            <span className="font-medium">Not access-controlled.</span> Prices are saved to this
            browser only — they are not shared with other devices or visitors, and anyone who knows
            this URL can open it. Put it behind real auth before it manages live prices.
          </p>
        </div>

        <AdminPricing />
      </main>
    </Slab>
  </>
);
