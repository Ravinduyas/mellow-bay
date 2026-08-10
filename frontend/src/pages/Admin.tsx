import React from 'react';
import { IMAGES } from '../assets/images';
import { AdminPanel } from '../booking/AdminPanel';
import { PageHero } from '../components/PageHero';
import { Slab } from '../components/Slab';

export const Admin: React.FC = () => (
  <>
    <PageHero
      eyebrow="Admin"
      title="Booking engine"
      intro="Every booking that has come through, and the prices that produced them."
      image={IMAGES.coworkingDesks}
      imageAlt="Desks in the coworking space"
    />

    <Slab>
      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-9 md:px-14">
        {/* The page itself is unlinked and unguarded — the API's admin token is
            what actually protects the data behind it. */}
        <AdminPanel />
      </main>
    </Slab>
  </>
);
