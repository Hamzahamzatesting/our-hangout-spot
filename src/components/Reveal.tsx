import { motion } from 'motion/react';
import { MapPin, Info, ArrowLeft, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Reveal({ result, onBack }: { result: any, onBack: () => void }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!result) return null;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-[#050505]">
      <div className="atmosphere" />
      
      {!showContent ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="w-48 h-48 rounded-full border-[8px] border-white/5 flex items-center justify-center relative">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <motion.circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="url(#revealGrad)" 
                strokeWidth="8" 
                strokeDasharray="289"
                initial={{ strokeDashoffset: 289 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="revealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#22d3ee' }} />
                  <stop offset="100%" style={{ stopColor: '#c026d3' }} />
                </linearGradient>
              </defs>
            </svg>
            <Sparkles className="text-cyan-400 animate-pulse" size={40} />
          </div>
          <span className="font-display text-4xl uppercase tracking-[0.4em] text-gradient">The Revelation</span>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-xl z-10"
        >
          <div className="glass-card overflow-hidden border-white/10 shadow-2xl shadow-cyan-500/10">
            <div className="h-80 relative overflow-hidden group">
               <motion.div 
                 animate={{ scale: [1, 1.05, 1] }} 
                 transition={{ duration: 15, repeat: Infinity }}
                 className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center grayscale brightness-50 group-hover:grayscale-0 transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
               
               <div className="absolute bottom-8 left-8 right-8 text-center">
                  <div className="inline-flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3 bg-cyan-400/10 px-4 py-1.5 rounded-full border border-cyan-400/20 backdrop-blur-md">
                    <MapPin size={12} />
                    {result.location}
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
                    {result.name}
                  </h2>
               </div>
            </div>

            <div className="p-10">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4 text-center">The Oracle's Synthesis</h3>
              <p className="text-2xl text-white/90 font-medium italic leading-tight mb-10 text-center">
                "{result.reasoning}"
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
                   <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Vibe Match</div>
                   <div className="text-3xl font-black text-cyan-400">{result.vibeMatch}%</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
                   <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Status</div>
                   <div className="text-3xl font-black text-fuchsia-500 uppercase tracking-tighter">Verified</div>
                </div>
              </div>

              <button 
                onClick={onBack}
                className="noctua-btn w-full"
              >
                <ArrowLeft size={20} />
                <span className="font-bold uppercase tracking-widest text-sm text-black">New Quest</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
