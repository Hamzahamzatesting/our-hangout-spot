import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, Plus, CheckCircle2 } from 'lucide-react';
import { signIn } from '../firebase';

export default function Landing() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone;
    setIsIOS(ios);
    // Show install hint on iOS Safari only when NOT already installed
    if (ios && !standalone) setShowInstall(true);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try { await signIn(); } catch { setIsSigningIn(false); }
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
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        <p className="text-white/20 text-xs mt-1">Private group · No followers · No feed</p>
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
