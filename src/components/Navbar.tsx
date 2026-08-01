import React, { useEffect, useState } from 'react';
import { ChevronRight, Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { HERO_DATA } from '../data/mockData';

export const NAV_LINKS = [
  { to: '/rooms', label: 'Rooms' },
  { to: '/eat-and-work', label: 'Eat & work' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the drawer whenever navigation happens.
  useEffect(() => setMobileMenuOpen(false), [pathname]);

  const solid = scrolled || mobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 text-white transition-colors duration-300 ${
        solid ? 'bg-ink/92 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}
    >
      {/* Three columns of equal weight so the links land on the true optical centre,
          regardless of how wide the wordmark or the CTA happen to be. */}
      <div className="max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-9 md:px-14 h-12 sm:h-14">
        <Link to="/" className="justify-self-start flex items-center gap-2 focus:outline-none">
          <span className="text-[13px] leading-none">✦</span>
          <span className="font-semibold text-[11px] sm:text-xs tracking-[0.18em] uppercase whitespace-nowrap">
            {HERO_DATA.companyName}
          </span>
        </Link>

        <nav className="hidden md:flex justify-self-center items-center gap-8 text-xs font-medium tracking-wide">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer keeps the grid balanced on small screens where the links are hidden */}
        <span className="md:hidden" aria-hidden="true" />

        <div className="justify-self-end flex items-center gap-2">
          <a
            href={HERO_DATA.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex bg-white hover:bg-white/90 text-ink text-[10.5px] font-semibold tracking-wide px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            Book now
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 -mr-1.5 focus:outline-none cursor-pointer"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-ink/95 backdrop-blur-md px-5 sm:px-9 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 text-left font-medium text-sm"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>
          ))}

          <a
            href={HERO_DATA.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center w-full py-3 bg-white text-ink rounded-2xl font-semibold text-xs"
          >
            Book now
          </a>
        </div>
      )}
    </header>
  );
};
