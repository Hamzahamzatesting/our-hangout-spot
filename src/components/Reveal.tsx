import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Sparkles } from 'lucide-react';

interface Props {
  result: any;
  onBack: () => void;
}

export default function Reveal({ result, onBack }: Props) {
  const [phase, setPhase] = useState<'loading' | 'reveal'>('loading');

  useEffect(() => {
    const t = setTimeout(() => setPhase('reveal'), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!result) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Animated circle */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <svg className="absolute inset-0 -rotate-90 w-48 h-48" viewBox="0 0 100 100">
                <motion.circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="289"
                  initial={{ strokeDashoffset: 289 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#c026d3" />
                  </linearGradient>
                </defs>
              </svg>
              <Sparkles className="text-cyan-400 animate-pulse" size={44} />
            </div>
            <p className="text-3xl font-black uppercase tracking-[0.3em] text-gradient"
               style={{ fontFamily: 'Anton, sans-serif' }}>
              Revealing…
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md z-10"
          >
            <div className="glass-card overflow-hidden border-white/10 shadow-2xl">
              {/* Image / gradient header */}
              <div className="h-56 relative overflow-hidden">
                {result.imageUrl ? (
                  <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-fuchsia-900/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

                {/* Sparkling dots */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-cyan-400"
                    style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 20}%` }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                    transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}

                <div className="absolute bottom-4 left-5 right-5">
                  {result.location && (
                    <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20 backdrop-blur-md">
                      <MapPin size={11} />
                      {result.location}
                    </div>
                  )}
                  <h2 className="text-4xl font-black uppercase tracking-tight text-white leading-tight"
                      style={{ fontFamily: 'Anton, sans-serif' }}>
                    {result.name || 'The Destination'}
                  </h2>
                </div>
              </div>

              <div className="p-6">
                {result.reasoning && (
                  <>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2 text-center">
                      Oracle's synthesis
                    </p>
                    <p className="text-lg text-white/80 font-medium italic leading-snug mb-6 text-center">
                      "{result.reasoning}"
                    </p>
                  </>
                )}

                {result.vibeMatch && (
                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-gradient">{result.vibeMatch}%</p>
                      <p className="label-xs mt-1">Vibe Match</p>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-cyan-400">✓</p>
                      <p className="label-xs mt-1">Confirmed</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={onBack}
                  className="btn-ghost w-full justify-center"
                >
                  <ArrowLeft size={18} />
                  Back to plans
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
