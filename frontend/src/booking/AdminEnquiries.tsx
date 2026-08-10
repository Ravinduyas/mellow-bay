import React, { useMemo, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import {
  ENQUIRY_STATUSES,
  Enquiry,
  EnquiryStatus,
  LESSON_LABELS,
  LEVEL_LABELS,
  MODEL_INCLUDES,
  MODEL_LABELS,
  ROOM_LABELS,
  SEAT_LABELS,
  STATUS_LABELS,
  formatMoney,
} from '@mellow-bay/booking-engine';
import { useEnquiries } from './enquiries';
import { Segmented, inputClass } from './ui';

/**
 * Every booking that has come through, and everything that was chosen in it.
 *
 * The detail view deliberately shows the whole selection rather than a summary:
 * the point of the panel is that staff can answer "what exactly did this person
 * ask for" without opening the database.
 */

const STATUS_TONE: Record<EnquiryStatus, string> = {
  new: 'bg-plum/10 text-plum',
  contacted: 'bg-tg/10 text-tg',
  confirmed: 'bg-emerald-500/10 text-emerald-700',
  closed: 'bg-slate-200 text-slate-500',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
};

export const AdminEnquiries: React.FC = () => {
  const { enquiries, stats, loading, error, reload, update } = useEnquiries();
  const [filter, setFilter] = useState<EnquiryStatus | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? enquiries : enquiries.filter((e) => e.status === filter)),
    [enquiries, filter],
  );

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Enquiries" value={String(stats.total)} />
        <Stat label="Awaiting reply" value={String(stats.byStatus.new ?? 0)} />
        <Stat
          label="In the pipeline"
          value={formatMoney(stats.pipelineValue, stats.currency)}
          hint="New and contacted"
        />
        <Stat
          label="Confirmed"
          value={formatMoney(stats.confirmedValue, stats.currency)}
          hint={`${stats.byStatus.confirmed ?? 0} booking${(stats.byStatus.confirmed ?? 0) === 1 ? '' : 's'}`}
        />
      </div>

      <section className="rounded-[24px] border border-slate-200/70 bg-white p-6 sm:p-8 elev-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-medium tracking-[-0.01em]">Bookings</h3>
          <div className="flex items-center gap-3">
            <Segmented<EnquiryStatus | 'all'>
              label="Filter by status"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                ...ENQUIRY_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
              ]}
            />
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-ink cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-[11px] text-mail">{error}</p>}

        {!error && visible.length === 0 && (
          <p className="mt-6 text-[11.5px] leading-relaxed text-slate-500">
            {loading
              ? 'Loading…'
              : enquiries.length === 0
                ? 'No bookings yet. One made through the booking flow will appear here.'
                : 'Nothing with that status.'}
          </p>
        )}

        <div className="mt-5 space-y-2.5">
          {visible.map((enquiry) => (
            <EnquiryRow
              key={enquiry.id}
              enquiry={enquiry}
              open={openId === enquiry.id}
              onToggle={() => setOpenId(openId === enquiry.id ? null : enquiry.id)}
              onUpdate={update}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-[20px] border border-slate-200/70 bg-white p-5 elev-1">
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-medium tabular-nums tracking-[-0.02em]">{value}</p>
    {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const EnquiryRow: React.FC<{
  enquiry: Enquiry;
  open: boolean;
  onToggle: () => void;
  onUpdate: (id: string, patch: { status?: EnquiryStatus; staffNotes?: string }) => Promise<boolean>;
}> = ({ enquiry, open, onToggle, onUpdate }) => {
  const [notes, setNotes] = useState(enquiry.staffNotes ?? '');
  const [saving, setSaving] = useState(false);
  const { selection, quote } = enquiry;
  const includes = MODEL_INCLUDES[selection.model];

  const notesDirty = notes !== (enquiry.staffNotes ?? '');

  const setStatus = async (status: EnquiryStatus) => {
    setSaving(true);
    await onUpdate(enquiry.id, { status });
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    await onUpdate(enquiry.id, { staffNotes: notes });
    setSaving(false);
  };

  return (
    <article className="rounded-[16px] border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-4 text-left cursor-pointer"
      >
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${STATUS_TONE[enquiry.status]}`}>
          {STATUS_LABELS[enquiry.status]}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">
            {selection.contact.name.trim() || 'No name given'}
          </span>
          <span className="block truncate text-[10.5px] text-slate-500">
            {MODEL_LABELS[selection.model].title} · {formatDate(selection.checkIn)} –{' '}
            {formatDate(selection.checkOut)} · {quote.nights} night{quote.nights === 1 ? '' : 's'}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block text-[13px] font-medium tabular-nums">
            {formatMoney(quote.total, quote.currency)}
          </span>
          <span className="block text-[10px] text-slate-400">{formatDate(enquiry.createdAt)}</span>
        </span>

        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* What they asked for */}
            <div className="space-y-4">
              <Group title="Guest">
                <Row k="Name" v={selection.contact.name || '—'} />
                <Row k="Email" v={selection.contact.email || '—'} />
                <Row k="Phone" v={selection.contact.phone || '—'} />
                {selection.contact.notes && <Row k="Their note" v={selection.contact.notes} />}
              </Group>

              <Group title="Stay">
                <Row k="Booking model" v={MODEL_LABELS[selection.model].title} />
                <Row k="Check in" v={formatDate(selection.checkIn)} />
                <Row k="Check out" v={formatDate(selection.checkOut)} />
                <Row k="Nights" v={String(quote.nights)} />
                <Row k="Room" v={ROOM_LABELS[selection.room.kind]} />
                <Row k="Guests" v={String(selection.room.people)} />
              </Group>

              {includes.coworking && (
                <Group title="Coworking">
                  <Row k="Seat type" v={SEAT_LABELS[selection.coworking.seatType]} />
                  <Row k="Seats" v={String(selection.coworking.seats)} />
                </Group>
              )}

              {includes.surf && (
                <Group title="Surf">
                  <Row k="First lesson" v={formatDate(selection.surf.date)} />
                  {selection.surf.guests.map((g, i) => (
                    <Row
                      key={g.id}
                      k={g.name.trim() || `Surfer ${i + 1}`}
                      v={`${LEVEL_LABELS[g.level]} · ${LESSON_LABELS[g.lessonType]}`}
                    />
                  ))}
                </Group>
              )}

              <Group title="Extras">
                <Row k="Airport pickup" v={selection.addons.airportPickup ? 'Yes' : 'No'} />
              </Group>
            </div>

            {/* What they were quoted */}
            <div className="space-y-4">
              <Group title="Quote as sent">
                {quote.lines.map((line) => (
                  <div key={line.id} className="flex items-baseline justify-between gap-3 py-1">
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px]">{line.label}</span>
                      <span className="block text-[10px] text-slate-400">{line.detail}</span>
                    </span>
                    <span className="shrink-0 text-[11.5px] tabular-nums">
                      {formatMoney(line.amount, quote.currency)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-3">
                  <span className="text-[12px] font-medium">Total</span>
                  <span className="text-[15px] font-medium tabular-nums">
                    {formatMoney(quote.total, quote.currency)}
                  </span>
                </div>
                <p className="mt-2 text-[9.5px] leading-relaxed text-slate-400">
                  Priced when the enquiry came in. Later price changes do not alter it.
                </p>
              </Group>

              <Group title="Handling">
                <div className="space-y-3 pt-1">
                  <Segmented<EnquiryStatus>
                    label="Status"
                    value={enquiry.status}
                    onChange={setStatus}
                    options={ENQUIRY_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                  />

                  <textarea
                    rows={3}
                    placeholder="Internal notes — not shown to the guest"
                    className={`${inputClass} resize-none`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveNotes}
                      disabled={!notesDirty || saving}
                      className="rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium text-white transition-colors hover:bg-ink-soft disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving…' : 'Save note'}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      Received {formatDateTime(enquiry.createdAt)}
                      {enquiry.updatedAt && ` · updated ${formatDateTime(enquiry.updatedAt)}`}
                    </span>
                  </div>
                </div>
              </Group>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</h4>
    <div className="mt-2">{children}</div>
  </div>
);

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex items-baseline justify-between gap-4 py-1">
    <span className="shrink-0 text-[11px] text-slate-500">{k}</span>
    <span className="text-right text-[11.5px] break-words">{v}</span>
  </div>
);
