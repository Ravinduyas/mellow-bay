import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { ServicesSection } from '../components/ServicesSection';
import { GridFeaturesSection } from '../components/GridFeaturesSection';
import { ReviewsSection } from '../components/ReviewsSection';
import { ExploreSection } from '../components/ExploreSection';
import { Slab } from '../components/Slab';
import { useModals } from '../ui/ModalContext';

export const Home: React.FC = () => {
  const { openEnquiry, openGallery } = useModals();

  const scrollToReviews = () =>
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <HeroSection onOpenQuiz={openEnquiry} />

      <Slab>
        <main>
          <ServicesSection />
          <GridFeaturesSection onOpenReviews={scrollToReviews} onOpenGallery={openGallery} />
          <ReviewsSection />
          <ExploreSection />
        </main>
      </Slab>
    </>
  );
};
