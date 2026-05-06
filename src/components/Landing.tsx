import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, Plus, CheckCircle2 } from 'lucide-react';
import { signIn } from '../firebase';

export default function Landing() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone;
    setIsIOS(ios);
    // Show install hint on iOS Safari only when NOT already installed
    if (ios && !standalone) setShowInstall(true);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError('');
    try {
      await signIn();
    } catch {
      setError('Could not start your session. Try again.');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10 relative overflow-hidden">
      {/* Hero */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center text-center z-10 gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-cyan-400 to-fuchsia-600 flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.3)] mb-2">
          <span className="text-4xl font-black text-black" style={{ fontFamily: 'Anton, sans-serif' }}>H</span>
        </div>

        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight text-gradient mb-3"
              style={{ fontFamily: 'Anton, sans-serif' }}>
            Hangout
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-xs mx-auto">
            From <span className="text-white/80">"we should go out"</span> to a locked-in plan
            in under a minute.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {['One-tap voting', 'Mystery Mode 🕵️', 'Live crew'].map(f => (
            <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="btn-primary w-full max-w-xs mt-4 text-lg font-black uppercase tracking-widest"
        >
          {isSigningIn ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <span className="text-xl leading-none">🙂</span>
              Start
            </>
          )}
        </motion.button>

        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        <p className="text-white/20 text-xs mt-1">Full name + cartoon face required · No followers · No feed</p>
      </motion.div>

      {/* iOS Install Banner */}
      <AnimatePresence>
        {showInstall && isIOS && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="z-20 glass-card p-5 border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-bold text-white/90">Add to Home Screen</p>
              <button onClick={() => setShowInstall(false)} className="text-white/40 text-xl leading-none">×</button>
            </div>
            <div className="space-y-2">
              {[
                { icon: <Share size={14} />, text: 'Tap the Share button in Safari' },
                { icon: <Plus size={14} />, text: 'Tap "Add to Home Screen"' },
                { icon: <CheckCircle2 size={14} />, text: 'Open Hangout like a real app' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-white/60 text-xs">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-cyan-400 shrink-0">
                    {step.icon}
                  </div>
                  {step.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
