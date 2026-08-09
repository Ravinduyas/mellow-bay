import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { HERO_DATA, ROOM_TYPES } from '../data/mockData';
import { EnquiryState } from '../types';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXTRAS = [
  'Airport pickup',
  'Breakfast included',
  'Yoga class',
  'Coworking desk',
  'Room service',
  'Late check-out',
];

export const QuizModal: React.FC<EnquiryModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [enquiry, setEnquiry] = useState<EnquiryState>({
    checkIn: '',
    checkOut: '',
    guests: 2,
    roomId: ROOM_TYPES[0].id,
    extras: ['Breakfast included'],
    contactName: '',
    phone: '',
    email: '',
  });

  if (!isOpen) return null;

  const room = ROOM_TYPES.find((r) => r.id === enquiry.roomId) ?? ROOM_TYPES[0];

  const nights =
    enquiry.checkIn && enquiry.checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(enquiry.checkOut).getTime() - new Date(enquiry.checkIn).getTime()) / 86400000,
          ),
        )
      : 0;

  const toggleExtra = (opt: string) => {
    setEnquiry((prev) => ({
      ...prev,
      extras: prev.extras.includes(opt)
        ? prev.extras.filter((o) => o !== opt)
        : [...prev.extras, opt],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            {/* Header / progress */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between pr-10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-plum/10 text-plum">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-semibold text-ink uppercase tracking-[0.12em]">
                    Check availability
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Step {step} of 4</span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-ink h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1 — dates and guests */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-ink">When are you coming?</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Check-in {HERO_DATA.checkIn}, check-out {HERO_DATA.checkOut}.
                  </p>
                </div>

                <div className="p-6 bg-paper rounded-2xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Check-in
                      </label>
                      <input
                        type="date"
                        value={enquiry.checkIn}
                        onChange={(e) => setEnquiry({ ...enquiry, checkIn: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Check-out
                      </label>
                      <input
                        type="date"
                        value={enquiry.checkOut}
                        min={enquiry.checkIn || undefined}
                        onChange={(e) => setEnquiry({ ...enquiry, checkOut: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-ink focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-medium text-slate-500">Guests</span>
                    <span className="text-2xl font-semibold text-ink">{enquiry.guests}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setEnquiry({ ...enquiry, guests: n })}
                        className={`py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          enquiry.guests === n
                            ? 'bg-ink text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {n} {n === 1 ? 'guest' : 'guests'}
                      </button>
                    ))}
                  </div>

                  {nights > 0 && (
                    <p className="text-[11px] text-slate-500">
                      {nights} {nights === 1 ? 'night' : 'nights'} in {HERO_DATA.city}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-ink hover:bg-ink-soft text-white font-medium text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: your room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — room */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-ink">Where would you like to sleep?</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Private rooms, a family suite, or a bed in one of the dorms.
                  </p>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {ROOM_TYPES.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setEnquiry({ ...enquiry, roomId: r.id })}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        enquiry.roomId === r.id
                          ? 'border-ink bg-ink text-white'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-ink'
                      }`}
                    >
                      <span>
                        <span className="font-medium text-sm block">{r.title}</span>
                        <span
                          className={`text-[11px] ${
                            enquiry.roomId === r.id ? 'text-white/60' : 'text-slate-500'
                          }`}
                        >
                          {r.bedSummary} · sleeps {r.sleeps} ·{' '}
                          {r.privateBathroom ? 'private bathroom' : 'shared bathroom'}
                        </span>
                      </span>
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          enquiry.roomId === r.id ? 'text-white' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-ink font-medium text-xs px-4 py-2 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-ink hover:bg-ink-soft text-white font-medium text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: extras</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — extras */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-ink">Anything we can set up for you?</h3>
                  <p className="text-slate-500 text-xs mt-1">Pick as many as you like.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXTRAS.map((option) => {
                    const selected = enquiry.extras.includes(option);
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => toggleExtra(option)}
                        className={`p-3.5 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'border-ink bg-ink text-white'
                            : 'border-slate-200 bg-white text-ink hover:border-slate-300'
                        }`}
                      >
                        <span>{option}</span>
                        <CheckCircle2
                          className={`w-4 h-4 ${selected ? 'text-white' : 'text-slate-300'}`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="text-slate-500 hover:text-ink font-medium text-xs px-4 py-2 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="bg-ink hover:bg-ink-soft text-white font-medium text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: your details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — summary and contact */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-ink">Where should we reply?</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    We will confirm availability and send you a rate for these dates.
                  </p>
                </div>

                <div className="bg-ink text-white p-5 rounded-2xl space-y-2">
                  <div className="text-[11px] text-white/50">Your stay</div>
                  <div className="text-lg font-semibold leading-snug">{room.title}</div>
                  <div className="text-[11px] text-white/60">
                    {enquiry.checkIn && enquiry.checkOut
                      ? `${enquiry.checkIn} → ${enquiry.checkOut} · ${nights} ${nights === 1 ? 'night' : 'nights'}`
                      : 'Dates to be confirmed'}
                    {' · '}
                    {enquiry.guests} {enquiry.guests === 1 ? 'guest' : 'guests'}
                  </div>
                  {enquiry.extras.length > 0 && (
                    <div className="text-[11px] text-white/50">{enquiry.extras.join(' · ')}</div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Your name
                    </label>
                    <input
                      type="text"
                      required
                      value={enquiry.contactName}
                      onChange={(e) => setEnquiry({ ...enquiry, contactName: e.target.value })}
                      placeholder="Alex Morgan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={enquiry.email}
                      onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-slate-500 hover:text-ink font-medium text-xs px-4 py-2 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="bg-plum hover:bg-plum-dark text-white font-medium text-xs px-7 py-3 rounded-xl pressable transition-colors cursor-pointer"
                  >
                    Send enquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-medium text-ink">Thanks — we have your enquiry</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
              We will email{' '}
              <span className="font-semibold text-ink">{enquiry.email}</span> with availability for{' '}
              {room.title.toLowerCase()}. You can also book instantly on Booking.com.
            </p>
            <div className="pt-4 flex items-center justify-center gap-2">
              <a
                href={HERO_DATA.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-plum hover:bg-plum-dark text-white font-medium text-xs px-6 py-3 rounded-xl pressable transition-colors"
              >
                Book on Booking.com
              </a>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  onClose();
                }}
                className="bg-paper hover:bg-slate-200 text-ink font-medium text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Back to site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
