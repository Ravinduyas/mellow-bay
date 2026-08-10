import React, { useState } from 'react';
import { CalendarRange, KeyRound, Tags } from 'lucide-react';
import { apiEnabled } from './api';
import { AdminEnquiries } from './AdminEnquiries';
import { AdminPricing } from './AdminPricing';
import { readAdminToken, writeAdminToken } from './store';
import { Field, inputClass } from './ui';

/**
 * The admin panel: bookings on one side, the prices that produced them on the
 * other.
 *
 * The token lives here rather than inside either tab, because both need it and
 * an admin should enter it once.
 */

type Tab = 'bookings' | 'pricing';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'bookings', label: 'Bookings', icon: CalendarRange },
  { id: 'pricing', label: 'Pricing', icon: Tags },
];

export const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>('bookings');
  const [token, setToken] = useState(readAdminToken);
  // Remounts the tabs after a token change so their data reloads with it.
  const [tokenEpoch, setTokenEpoch] = useState(0);

  const applyToken = () => {
    writeAdminToken(token);
    setTokenEpoch((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      {/* How this panel is wired, and the credential it needs */}
      {apiEnabled ? (
        <section className="rounded-[24px] border border-slate-200/70 bg-white p-6 elev-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[240px] flex-1">
              <Field
                label="Admin token"
                hint="Held in this browser. Needed to read bookings and change prices."
              >
                <input
                  type="password"
                  autoComplete="off"
                  className={inputClass}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyToken()}
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={applyToken}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3 text-[11px] font-medium text-white transition-colors hover:bg-ink-soft cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Use token
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-[16px] border border-mail/30 bg-mail/5 p-4">
          <p className="text-[11px] leading-relaxed text-ink">
            <span className="font-medium">No booking service connected.</span> Bookings made on this
            site are kept in this browser only and prices apply to this browser only — nothing here
            is shared with other visitors or devices. Set <code>VITE_API_URL</code> at build time to
            point the site at the backend.
          </p>
        </section>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
              tab === id
                ? 'bg-ink text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'bookings' ? (
        <AdminEnquiries key={`bookings-${tokenEpoch}`} />
      ) : (
        <AdminPricing key={`pricing-${tokenEpoch}`} />
      )}
    </div>
  );
};
