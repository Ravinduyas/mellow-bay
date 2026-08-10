import React, { useEffect, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { formatMoney, withMargin } from './pricing';
import { usePrices } from './store';
import { Counter } from './ui';
import {
  LESSON_LABELS,
  LEVEL_LABELS,
  LessonType,
  PriceConfig,
  ROOM_LABELS,
  RoomKind,
  SEAT_LABELS,
  SeatType,
  SurfLevel,
} from './types';

/**
 * The chart's "Admin Price Adding Flow" — base prices via the +/- counters,
 * plus the profit and coworking margins.
 *
 * Edits are held locally until saved, so a half-finished change never reaches
 * the booking flow.
 */
export const AdminPricing: React.FC = () => {
  const { prices, save, reset } = usePrices();
  const [draft, setDraft] = useState<PriceConfig>(prices);
  const [status, setStatus] = useState<'idle' | 'saved' | 'failed'>('idle');

  // Pick up an external change (another tab, or a reset) while nothing is
  // being edited here.
  useEffect(() => setDraft(prices), [prices]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(prices);

  const setRoom = (kind: RoomKind, patch: Partial<PriceConfig['rooms'][RoomKind]>) =>
    setDraft((d) => ({ ...d, rooms: { ...d.rooms, [kind]: { ...d.rooms[kind], ...patch } } }));

  const setLesson = (level: SurfLevel, type: LessonType, value: number) =>
    setDraft((d) => ({
      ...d,
      surf: { lesson: { ...d.surf.lesson, [level]: { ...d.surf.lesson[level], [type]: value } } },
    }));

  const onSave = () => {
    const ok = save(draft);
    setStatus(ok ? 'saved' : 'failed');
    window.setTimeout(() => setStatus('idle'), 2600);
  };

  return (
    <div className="space-y-5">
      {/* Rooms */}
      <Panel
        title="Rooms"
        note="Base rate covers the included guests; each guest beyond that adds the extra rate per night. Margin is added on top of cost."
      >
        <div className="space-y-3">
          {(Object.keys(ROOM_LABELS) as RoomKind[]).map((kind) => {
            const r = draft.rooms[kind];
            return (
              <div key={kind} className="rounded-[16px] border border-slate-200 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-[13px] font-medium">{ROOM_LABELS[kind]}</h4>
                  <span className="text-[10.5px] text-slate-500">
                    sells at{' '}
                    <span className="font-medium text-ink tabular-nums">
                      {formatMoney(withMargin(r.basePerNight, r.marginPct), draft.currency)}
                    </span>{' '}
                    / night
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Row label="Base cost per night">
                    <Counter
                      label={`${kind} base price`}
                      value={r.basePerNight}
                      max={2000}
                      onChange={(basePerNight) => setRoom(kind, { basePerNight })}
                    />
                  </Row>
                  <Row label="Profit margin">
                    <Counter
                      label={`${kind} margin`}
                      value={r.marginPct}
                      max={300}
                      step={5}
                      suffix="%"
                      onChange={(marginPct) => setRoom(kind, { marginPct })}
                    />
                  </Row>
                  <Row label="Per extra guest, per night">
                    <Counter
                      label={`${kind} extra guest price`}
                      value={r.perExtraPersonPerNight}
                      max={500}
                      onChange={(perExtraPersonPerNight) =>
                        setRoom(kind, { perExtraPersonPerNight })
                      }
                    />
                  </Row>
                  <Row label="Guests included / max">
                    <div className="flex items-center gap-2">
                      <Counter
                        label={`${kind} included guests`}
                        value={r.includedPeople}
                        min={1}
                        max={r.maxPeople}
                        onChange={(includedPeople) => setRoom(kind, { includedPeople })}
                      />
                      <Counter
                        label={`${kind} max guests`}
                        value={r.maxPeople}
                        min={r.includedPeople}
                        max={12}
                        onChange={(maxPeople) => setRoom(kind, { maxPeople })}
                      />
                    </div>
                  </Row>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Coworking */}
      <Panel title="Coworking" note="Priced per seat per day, by chair type, with its own margin.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(SEAT_LABELS) as SeatType[]).map((t) => (
            <Row key={t} label={`${SEAT_LABELS[t]} — cost per day`}>
              <Counter
                label={`${t} seat price`}
                value={draft.coworking.seatPerDay[t]}
                max={500}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    coworking: { ...d.coworking, seatPerDay: { ...d.coworking.seatPerDay, [t]: v } },
                  }))
                }
              />
            </Row>
          ))}
          <Row label="Coworking margin">
            <Counter
              label="coworking margin"
              value={draft.coworking.marginPct}
              max={300}
              step={5}
              suffix="%"
              onChange={(marginPct) =>
                setDraft((d) => ({ ...d, coworking: { ...d.coworking, marginPct } }))
              }
            />
          </Row>
        </div>
      </Panel>

      {/* Lessons */}
      <Panel
        title="Surf lessons"
        note="Charged per person at the price for their level and lesson type. No margin is applied — these are the sell prices."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <th className="pr-4 font-semibold">Level</th>
                {(Object.keys(LESSON_LABELS) as LessonType[]).map((t) => (
                  <th key={t} className="pr-4 font-semibold">
                    {LESSON_LABELS[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(LEVEL_LABELS) as SurfLevel[]).map((level) => (
                <tr key={level}>
                  <td className="pr-4 text-[12px] font-medium">{LEVEL_LABELS[level]}</td>
                  {(Object.keys(LESSON_LABELS) as LessonType[]).map((type) => (
                    <td key={type} className="pr-4">
                      <Counter
                        label={`${level} ${type} lesson price`}
                        value={draft.surf.lesson[level][type]}
                        max={2000}
                        step={5}
                        onChange={(v) => setLesson(level, type, v)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Addons */}
      <Panel
        title="Airport pickup"
        note="Charged per party. A party is matched to the first band large enough to hold it."
      >
        <div className="space-y-3">
          {draft.addons.airportPickup.map((band, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[12px]">Up to {band.upToPeople} people</span>
              <Counter
                label={`pickup price up to ${band.upToPeople}`}
                value={band.price}
                max={2000}
                step={5}
                onChange={(price) =>
                  setDraft((d) => ({
                    ...d,
                    addons: {
                      airportPickup: d.addons.airportPickup.map((b, j) =>
                        j === i ? { ...b, price } : b,
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Panel>

      {/* Actions */}
      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200/70 bg-white/95 p-4 backdrop-blur elev-2">
        <p className="text-[11px] text-slate-500">
          {status === 'saved'
            ? 'Saved. The booking flow is quoting these prices now.'
            : status === 'failed'
              ? 'Could not save — browser storage is unavailable.'
              : dirty
                ? 'Unsaved changes.'
                : 'Prices are stored in this browser only.'}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-ink cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3 text-[11px] font-medium text-white transition-colors hover:bg-ink-soft disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            Save prices
          </button>
        </div>
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; note: string; children: React.ReactNode }> = ({
  title,
  note,
  children,
}) => (
  <section className="rounded-[24px] border border-slate-200/70 bg-white p-6 sm:p-8 elev-1">
    <h3 className="text-lg font-medium tracking-[-0.01em]">{title}</h3>
    <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-500">{note}</p>
    <div className="mt-6">{children}</div>
  </section>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <span className="text-[11px] text-slate-600">{label}</span>
    {children}
  </div>
);
