import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_SECTIONS } from '../data/mockData';

/** Closing hub on the home page — a way through to every other page on the site. */
export const ExploreSection: React.FC = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-9 md:px-14 py-14 sm:py-16">
    <div className="mb-8">
      <h2 className="text-[30px] sm:text-4xl font-medium tracking-[-0.02em] leading-[1.12]">
        <span className="text-ink">Where to next</span>
      </h2>
      <p className="mt-4 text-slate-500 text-[11px]">
        The rest of the site, in four stops
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {SITE_SECTIONS.map((section, i) => (
        <Link
          key={section.to}
          to={section.to}
          className="group bg-white rounded-[20px] border border-slate-200/70 overflow-hidden flex flex-col hover:shadow-lg hover:border-slate-300 transition-all"
        >
          <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
            <img
              src={section.imageUrl}
              alt={section.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="p-5 flex flex-col gap-2 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {String(i + 1).padStart(2, '0')} · {section.label}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-ink transition-colors shrink-0" />
            </div>

            <h3 className="text-[15px] font-medium leading-snug">{section.title}</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">{section.detail}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);
