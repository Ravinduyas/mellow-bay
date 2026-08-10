import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { formatMoney, quote } from '@mellow-bay/booking-engine';
import { apiEnabled, submitEnquiry } from './api';
import { usePrices } from './store';
import { ChoiceGroup, Counter, Field, Segmented, inputClass } from './ui';
import {
  BookingModel,
  BookingSelection,
  LESSON_LABELS,
  LEVEL_LABELS,
  LessonType,
  MODEL_INCLUDES,
  MODEL_LABELS,
  ROOM_LABELS,
  RoomKind,
  SEAT_LABELS,
  SeatType,
  SurfGuest,
  SurfLevel,
} from '@mellow-bay/booking-engine';

/** yyyy-mm-dd for today, in the viewer's own timezone. */
const today = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const addDays = (iso: string, days: number) => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
};

let guestSeq = 0;
const newGuest = (): SurfGuest => ({
  id: `g${++guestSeq}`,
  name: '',
  level: 'beginner',
  lessonType: 'general',
});

const initialSelection = (): BookingSelection => ({
  model: 'rooms',
  checkIn: addDays(today(), 7),
  checkOut: addDays(today(), 10),
  room: { kind: 'double', people: 2 },
  coworking: { seatType: 'normal', seats: 1 },
  surf: { date: addDays(today(), 8), guests: [newGuest()] },
  addons: { airportPickup: false },
  contact: { name: '', email: '', phone: '', notes: '' },
});

type StepId = 'model' | 'stay' | 'coworking' | 'surf' | 'extras' | 'review';

const STEP_TITLES: Record<StepId, string> = {
  model: 'What are you booking',
  stay: 'Dates and room',
  coworking: 'Coworking',
  surf: 'Surf package',
  extras: 'Extras',
  review: 'Review and send',
};

export const BookingEngine: React.FC = () => {
  const { prices } = usePrices();
  const [selection, setSelection] = useState<BookingSelection>(initialSelection);
  const [stepIndex, setStepIndex] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const includes = MODEL_INCLUDES[selection.model];

  // Steps are derived from the chosen model, so changing the model reshapes the
  // flow rather than leaving dead steps in it.
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ['model', 'stay'];
    if (includes.coworking) s.push('coworking');
    if (includes.surf) s.push('surf');
    s.push('extras', 'review');
    return s;
  }, [includes.coworking, includes.surf]);

  // Dropping a step (by switching to a smaller model) can leave the index past
  // the end of the new list.
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[safeIndex];

  const priced = useMemo(() => quote(selection, prices), [selection, prices]);

  const patch = (next: Partial<BookingSelection>) => setSelection((s) => ({ ...s, ...next }));

  const roomCfg = prices.rooms[selection.room.kind];

  const datesValid = priced.nights > 0;
  const contactValid =
    selection.contact.name.trim().length > 1 && selection.contact.email.includes('@');

  const canAdvance = step === 'stay' ? datesValid : step === 'review' ? contactValid : true;

  /**
   * With a backend the enquiry is recorded server-side and repriced there, so
   * the total on file is the server's, not the one this browser was showing.
   * Without one there is nowhere to send it — the flow still confirms, but the
   * confirmation says plainly that nothing was transmitted.
   */
  const onSubmit = async () => {
    if (!apiEnabled) {
      setSent(true);
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await submitEnquiry(selection);
      setSent(true);
    } catch (err) {
      const e = err as { message?: string; details?: string[] };
      setSendError([e.message, ...(e.details ?? [])].filter(Boolean).join(' — '));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-[24px] border border-slate-200/70 bg-white p-8 sm:p-12 text-center elev-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-2xl font-medium tracking-[-0.02em]">
          {apiEnabled ? 'Enquiry sent' : 'Quote ready'}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-500">
          {apiEnabled ? (
            <>
              We have your details and the quote below. Someone will come back to you to confirm
              availability and take payment — nothing is charged or held yet.
            </>
          ) : (
            <>
              This is your quote. This site has no booking service connected, so nothing has been
              sent to us — take a copy and get in touch, or book through the listing.
            </>
          )}
        </p>
        <div className="mx-auto mt-7 max-w-sm">
          <QuotePanel priced={priced} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* --- Flow --- */}
      <div className="lg:col-span-8 space-y-5">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <button
                type="button"
                // Only completed steps are reachable; jumping ahead would skip
                // the validation the Continue button enforces.
                disabled={i > safeIndex}
                onClick={() => setStepIndex(i)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  i === safeIndex
                    ? 'bg-ink text-white'
                    : i < safeIndex
                      ? 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
                      : 'text-slate-300'
                }`}
              >
                {i + 1}. {STEP_TITLES[s]}
              </button>
              {i < steps.length - 1 && <span className="text-slate-200">·</span>}
            </li>
          ))}
        </ol>

        <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 sm:p-8 elev-1">
          <h2 className="text-xl font-medium tracking-[-0.02em]">{STEP_TITLES[step]}</h2>

          <div className="mt-6 space-y-6">
            {step === 'model' && (
              <ChoiceGroup<BookingModel>
                value={selection.model}
                onChange={(model) => patch({ model })}
                options={(Object.keys(MODEL_LABELS) as BookingModel[]).map((m) => ({
                  value: m,
                  title: MODEL_LABELS[m].title,
                  detail: MODEL_LABELS[m].detail,
                }))}
              />
            )}

            {step === 'stay' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Check in">
                    <input
                      type="date"
                      className={inputClass}
                      min={today()}
                      value={selection.checkIn}
                      onChange={(e) => {
                        const checkIn = e.target.value;
                        // Keep the stay at least one night rather than letting
                        // check-out fall behind check-in.
                        const checkOut =
                          checkIn >= selection.checkOut ? addDays(checkIn, 1) : selection.checkOut;
                        patch({ checkIn, checkOut });
                      }}
                    />
                  </Field>
                  <Field label="Check out">
                    <input
                      type="date"
                      className={inputClass}
                      min={addDays(selection.checkIn, 1)}
                      value={selection.checkOut}
                      onChange={(e) => patch({ checkOut: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Room">
                  <ChoiceGroup<RoomKind>
                    columns={3}
                    value={selection.room.kind}
                    onChange={(kind) =>
                      patch({
                        room: {
                          kind,
                          people: Math.min(selection.room.people, prices.rooms[kind].maxPeople),
                        },
                      })
                    }
                    options={(Object.keys(ROOM_LABELS) as RoomKind[]).map((k) => ({
                      value: k,
                      title: ROOM_LABELS[k],
                      detail: `from ${formatMoney(
                        prices.rooms[k].basePerNight,
                        prices.currency,
                      )} / night`,
                    }))}
                  />
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-slate-200 p-4">
                  <div>
                    <p className="text-[13px] font-medium">Guests</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      {roomCfg.includedPeople} included · up to {roomCfg.maxPeople}
                      {roomCfg.perExtraPersonPerNight > 0 &&
                        ` · ${formatMoney(
                          roomCfg.perExtraPersonPerNight,
                          prices.currency,
                        )} per extra guest, per night`}
                    </p>
                  </div>
                  <Counter
                    label="guests"
                    value={selection.room.people}
                    min={1}
                    max={roomCfg.maxPeople}
                    onChange={(people) => patch({ room: { ...selection.room, people } })}
                  />
                </div>

                {!datesValid && (
                  <p className="text-[11px] text-mail">
                    Check-out needs to be at least one night after check-in.
                  </p>
                )}
              </>
            )}

            {step === 'coworking' && (
              <>
                <Field label="Seat type">
                  <ChoiceGroup<SeatType>
                    value={selection.coworking.seatType}
                    onChange={(seatType) => patch({ coworking: { ...selection.coworking, seatType } })}
                    options={(Object.keys(SEAT_LABELS) as SeatType[]).map((t) => ({
                      value: t,
                      title: SEAT_LABELS[t],
                      detail: `${formatMoney(
                        prices.coworking.seatPerDay[t],
                        prices.currency,
                      )} per seat, per day`,
                    }))}
                  />
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-slate-200 p-4">
                  <div>
                    <p className="text-[13px] font-medium">Seats</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      Charged for the {priced.nights} day{priced.nights === 1 ? '' : 's'} of your
                      stay
                    </p>
                  </div>
                  <Counter
                    label="seats"
                    value={selection.coworking.seats}
                    min={0}
                    max={12}
                    onChange={(seats) => patch({ coworking: { ...selection.coworking, seats } })}
                  />
                </div>
              </>
            )}

            {step === 'surf' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="First lesson date">
                    <input
                      type="date"
                      className={inputClass}
                      min={selection.checkIn}
                      max={selection.checkOut}
                      value={selection.surf.date}
                      onChange={(e) => patch({ surf: { ...selection.surf, date: e.target.value } })}
                    />
                  </Field>

                  <Field label="How many surfing">
                    <div className="pt-1">
                      <Counter
                        label="surfers"
                        value={selection.surf.guests.length}
                        min={1}
                        max={8}
                        onChange={(n) => {
                          const guests = [...selection.surf.guests];
                          while (guests.length < n) guests.push(newGuest());
                          guests.length = n;
                          patch({ surf: { ...selection.surf, guests } });
                        }}
                      />
                    </div>
                  </Field>
                </div>

                {/* The chart is explicit that level and lesson type are chosen
                    per person, not once for the group. */}
                <div className="space-y-3">
                  {selection.surf.guests.map((guest, i) => (
                    <div key={guest.id} className="rounded-[16px] border border-slate-200 p-4 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Surfer {i + 1}
                        </span>
                        <span className="text-[11px] font-medium tabular-nums">
                          {formatMoney(
                            prices.surf.lesson[guest.level][guest.lessonType],
                            prices.currency,
                          )}
                        </span>
                      </div>

                      <input
                        className={inputClass}
                        placeholder="Name"
                        value={guest.name}
                        onChange={(e) => {
                          const guests = selection.surf.guests.map((g) =>
                            g.id === guest.id ? { ...g, name: e.target.value } : g,
                          );
                          patch({ surf: { ...selection.surf, guests } });
                        }}
                      />

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Segmented<SurfLevel>
                          label={`Level for surfer ${i + 1}`}
                          value={guest.level}
                          onChange={(level) => {
                            const guests = selection.surf.guests.map((g) =>
                              g.id === guest.id ? { ...g, level } : g,
                            );
                            patch({ surf: { ...selection.surf, guests } });
                          }}
                          options={(Object.keys(LEVEL_LABELS) as SurfLevel[]).map((l) => ({
                            value: l,
                            label: LEVEL_LABELS[l],
                          }))}
                        />

                        <Segmented<LessonType>
                          label={`Lesson type for surfer ${i + 1}`}
                          value={guest.lessonType}
                          onChange={(lessonType) => {
                            const guests = selection.surf.guests.map((g) =>
                              g.id === guest.id ? { ...g, lessonType } : g,
                            );
                            patch({ surf: { ...selection.surf, guests } });
                          }}
                          options={(Object.keys(LESSON_LABELS) as LessonType[]).map((t) => ({
                            value: t,
                            label: LESSON_LABELS[t],
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'extras' && (
              <button
                type="button"
                onClick={() =>
                  patch({ addons: { airportPickup: !selection.addons.airportPickup } })
                }
                className={`flex w-full items-center justify-between gap-4 rounded-[16px] border p-5 text-left transition-colors cursor-pointer ${
                  selection.addons.airportPickup
                    ? 'border-ink bg-ink text-white'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span>
                  <span className="block text-[13px] font-medium">Airport pickup and drop</span>
                  <span
                    className={`mt-1 block text-[10.5px] ${
                      selection.addons.airportPickup ? 'text-white/60' : 'text-slate-500'
                    }`}
                  >
                    Priced per party, not per person
                  </span>
                </span>
                <span className="text-xs font-medium tabular-nums">
                  {formatMoney(
                    prices.addons.airportPickup[prices.addons.airportPickup.length - 1]?.price ?? 0,
                    prices.currency,
                  )}
                </span>
              </button>
            )}

            {step === 'review' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Your name">
                    <input
                      className={inputClass}
                      value={selection.contact.name}
                      onChange={(e) =>
                        patch({ contact: { ...selection.contact, name: e.target.value } })
                      }
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      className={inputClass}
                      value={selection.contact.email}
                      onChange={(e) =>
                        patch({ contact: { ...selection.contact, email: e.target.value } })
                      }
                    />
                  </Field>
                </div>
                <Field label="Phone" hint="Optional">
                  <input
                    className={inputClass}
                    value={selection.contact.phone}
                    onChange={(e) =>
                      patch({ contact: { ...selection.contact, phone: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Anything else" hint="Optional">
                  <textarea
                    rows={3}
                    className={`${inputClass} resize-none`}
                    value={selection.contact.notes}
                    onChange={(e) =>
                      patch({ contact: { ...selection.contact, notes: e.target.value } })
                    }
                  />
                </Field>
                {!contactValid && (
                  <p className="text-[11px] text-slate-400">
                    A name and email are needed before we can send this.
                  </p>
                )}
                {sendError && <p className="text-[11px] text-mail">{sendError}</p>}
              </div>
            )}
          </div>

          {/* --- Navigation --- */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setStepIndex(Math.max(0, safeIndex - 1))}
              disabled={safeIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            {step === 'review' ? (
              <button
                type="button"
                disabled={!contactValid || sending}
                onClick={onSubmit}
                className="inline-flex items-center gap-1.5 rounded-full bg-plum px-7 py-3 text-[11px] font-medium text-white transition-colors hover:bg-plum-dark disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {sending ? 'Sending…' : apiEnabled ? 'Send enquiry' : 'See your quote'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStepIndex(Math.min(steps.length - 1, safeIndex + 1))}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-7 py-3 text-[11px] font-medium text-white transition-colors hover:bg-ink-soft disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Running total --- */}
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          <QuotePanel priced={priced} />
        </div>
      </div>
    </div>
  );
};

const QuotePanel: React.FC<{ priced: ReturnType<typeof quote> }> = ({ priced }) => (
  <div className="rounded-[24px] border border-slate-200/70 bg-white p-6 elev-1">
    <h3 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
      Your quote
    </h3>

    {priced.lines.length === 0 ? (
      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Pick your dates to see a price.
      </p>
    ) : (
      <ul className="mt-4 space-y-3">
        {priced.lines.map((line) => (
          <li key={line.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium text-ink">{line.label}</span>
              <span className="block text-[10px] leading-relaxed text-slate-500">{line.detail}</span>
            </span>
            <span className="shrink-0 text-[12px] tabular-nums text-ink">
              {formatMoney(line.amount, priced.currency)}
            </span>
          </li>
        ))}
      </ul>
    )}

    <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-4">
      <span className="text-[13px] font-medium">Total</span>
      <span className="text-lg font-medium tabular-nums tracking-[-0.02em]">
        {formatMoney(priced.total, priced.currency)}
      </span>
    </div>

    <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
      An estimate, not a confirmed booking. Nothing is charged or held until we come back to you.
    </p>
  </div>
);
