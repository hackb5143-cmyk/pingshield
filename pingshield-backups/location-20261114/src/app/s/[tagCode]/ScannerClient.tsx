'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { TagPublicInfo } from '@/lib/supabase';
import {
  Shield,
  MapPin,
  Send,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Navigation,
  Lock,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';

interface ScannerClientProps {
  tag: TagPublicInfo;
}

interface SubmittedReportInfo {
  reportId: string;
  tagCode: string;
  timestamp: string;
  message: string;
  locationSummary?: string;
}

export default function ScannerClient({ tag }: ScannerClientProps) {
  // Form State
  const [message, setMessage] = useState('');
  const [finderContact, setFinderContact] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState(''); // Anti-spam bot trap

  // GPS State
  const [isLocating, setIsLocating] = useState(false);
  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<SubmittedReportInfo | null>(null);

  // Request GPS Location after explicit user action
  const handleRequestGPS = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setGpsData({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('Location permission denied. You can manually type the pickup location below.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('Position unavailable. Please type your location manually.');
            break;
          case err.TIMEOUT:
            setGpsError('Location request timed out. Please try again or type manually.');
            break;
          default:
            setGpsError('Could not acquire GPS fix. Please enter pickup landmark below.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const handleClearGPS = () => {
    setGpsData(null);
    setGpsError(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (message.trim().length < 3) {
      setSubmissionError('Please write a short message explaining where the item is located.');
      return;
    }
    if (!gpsData && !manualLocation.trim()) {
      setSubmissionError('Share GPS or enter a pickup location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagCode: tag.tag_code,
          message: message.trim(),
          finderContact: finderContact.trim() || null,
          latitude: gpsData?.latitude ?? null,
          longitude: gpsData?.longitude ?? null,
          accuracy: gpsData?.accuracy ?? null,
          manualLocation: manualLocation.trim() || null,
          website: websiteHoneypot, // Honeypot
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit recovery report');
      }

      setSubmittedData({
        reportId: data.reportId,
        tagCode: data.tagCode || tag.tag_code,
        timestamp: data.timestamp || new Date().toISOString(),
        message: message.trim(),
        locationSummary: gpsData
          ? `${gpsData.latitude}, ${gpsData.longitude} (±${gpsData.accuracy}m)`
          : manualLocation.trim() || undefined,
      });
    } catch (err: unknown) {
      setSubmissionError(err instanceof Error ? err.message : 'Network error while sending report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex justify-center py-6 px-3 sm:px-4 selection:bg-rose-500 selection:text-white">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* ── TOP BRAND BAR ── */}
        <header className="flex items-center justify-between py-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                PingShield
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Privacy-First Item Recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {tag.tag_code}
            </span>
          </div>
        </header>

        {/* ── EMERGENCY HOTLINES PANEL (Requirement 5) ── */}
        <section className="glass-panel rounded-2xl p-3.5 border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900/60 to-rose-950/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                Emergency & Roadside Hotlines
              </span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-semibold">
              Tap to Call
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:112"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-rose-500/20 hover:border-rose-400/50 hover:bg-rose-900/20 transition-all text-white group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">112</div>
                  <div className="text-[10px] text-slate-400">Police / SOS</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
            </a>

            <a
              href="tel:1033"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-900/20 transition-all text-white group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">1033</div>
                  <div className="text-[10px] text-slate-400">Highway Help</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>
        </section>

        {/* ── VERIFIED SUBMISSION SUCCESS STATE ── */}
        {submittedData ? (
          <section className="glass-panel rounded-2xl p-6 sm:p-7 border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-slate-900/70 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              Report Sent to Owner
            </span>

            <h2 className="text-xl font-bold text-white mb-2">Thank You, Good Samaritan!</h2>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Your recovery message for <strong className="text-white">{tag.item_name}</strong> has been saved and is available in the owner dashboard for <span className="text-rose-400 font-semibold">{tag.owner_alias}</span>.
            </p>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-white/5 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Report ID:</span>
                <span className="font-mono text-emerald-400 font-bold">{submittedData.reportId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Tag Code:</span>
                <span className="font-mono text-white font-bold">{submittedData.tagCode}</span>
              </div>
              {submittedData.locationSummary && (
                <div className="flex justify-between items-start pb-2 border-b border-white/5">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200 text-right font-medium max-w-[200px] truncate">
                    {submittedData.locationSummary}
                  </span>
                </div>
              )}
              <div className="pt-1">
                <span className="text-slate-400 block mb-1">Your Message:</span>
                <p className="text-slate-200 italic bg-slate-900/80 p-2.5 rounded-lg border border-white/5">
                  &ldquo;{submittedData.message}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/owner"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <span>View Owner Dashboard (Demo Check)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedData(null);
                  setMessage('');
                  setGpsData(null);
                  setManualLocation('');
                }}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Send Another Update
              </button>
            </div>
          </section>
        ) : (
          /* ── MAIN RECOVERY FORM ── */
          <div className="flex flex-col gap-4">
            {/* Tag Info Card */}
            <section className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Protected Item
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {tag.item_name}
                  </h1>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  {tag.owner_alias}
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 inline" />
                </span>
                <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Phone Private
                </span>
              </div>
            </section>

            {/* Form */}
            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
              <div>
                <label htmlFor="recovery-msg" className="block text-xs font-bold text-slate-200 mb-1.5">
                  Recovery Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="recovery-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  required
                  rows={4}
                  placeholder="Where did you find this item? (e.g. Left on Metro seat, handed over to security desk, safe at reception...)"
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                />
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                  <span>Be descriptive to help the owner locate it</span>
                  <span>{message.length} / 1000</span>
                </div>
              </div>

              {/* ── LOCATION SECTION: GPS (Explicit Permission) or Manual ── */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> Item Location
                  </span>
                  <span className="text-[10px] text-slate-400">Explicit Permission</span>
                </div>

                {/* GPS Button / Acquired Badge */}
                {gpsData ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Navigation className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-200">
                          GPS Coordinates Captured
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400/90">
                          {gpsData.latitude}, {gpsData.longitude} (±{gpsData.accuracy}m)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearGPS}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={handleRequestGPS}
                      disabled={isLocating}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-rose-500/30 hover:border-rose-400/60 hover:bg-rose-950/20 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                          <span>Acquiring GPS Signal...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5 text-rose-400" />
                          <span>Share Current GPS Location</span>
                        </>
                      )}
                    </button>
                    {gpsError && (
                      <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0" /> {gpsError}
                      </p>
                    )}
                  </div>
                )}

                {/* Alternative Manual Location Input */}
                <div>
                  <label htmlFor="manual-loc" className="block text-[11px] font-medium text-slate-400 mb-1">
                    Or Enter Manual Landmark / Pickup Address:
                  </label>
                  <input
                    id="manual-loc"
                    type="text"
                    maxLength={300}
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g., Gate 2 Reception, Coffee Shop Counter 3"
                    className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Finder Optional Contact */}
              <div className="pt-2 border-t border-white/5">
                <label htmlFor="finder-contact" className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Contact Info <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="finder-contact"
                  type="text"
                  maxLength={120}
                  value={finderContact}
                  onChange={(e) => setFinderContact(e.target.value)}
                  placeholder="Your Phone / WhatsApp / Email so owner can reach you"
                  className="w-full rounded-xl bg-slate-900/90 border border-white/10 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Finder login is never required. Your info is only forwarded to the owner.
                </p>
              </div>

              {/* Bot Honeypot field (hidden) */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={websiteHoneypot}
                onChange={(e) => setWebsiteHoneypot(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              {/* Error Message */}
              {submissionError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-600/25 pink-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting to Owner...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Recovery Report to Owner</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── FOOTER NOTICE ── */}
        <footer className="text-center py-2 text-[11px] text-slate-400 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3 h-3 text-rose-400/80" />
            <span>Owner phone number stays private</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Link href="/demo" className="text-slate-400 hover:text-rose-300 underline underline-offset-2">
              Scan Demo QR
            </Link>
            <span>•</span>
            <Link href="/owner" className="text-slate-400 hover:text-rose-300 underline underline-offset-2">
              Owner Dashboard
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
