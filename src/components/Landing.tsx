import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, Lock, Zap } from 'lucide-react';
import { signIn } from '../firebase';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col p-8 relative overflow-hidden">
      <div className="atmosphere" />
      
      <header className="flex justify-between items-center z-10 mb-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-fuchsia-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold tracking-tighter">E</span>
          </div>
          <h1 className="text-2xl font-black tracking-widest uppercase">Echo</h1>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex gap-4 items-center">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Online</span>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
        </div>
      </header>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center text-center z-10"
      >
        <h2 className="text-7xl md:text-9xl font-black tracking-tighter uppercase mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
          The Oracle
        </h2>
        
        <p className="max-w-md mx-auto text-white/50 text-lg mb-12 font-medium leading-relaxed">
          The mystical collective consciousness for your next outing. Drop a vibe, break the shroud.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signIn}
          className="noctua-btn px-16 group"
        >
          <span className="text-xl font-black uppercase tracking-[0.2em]">Enter Ritual</span>
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <Sparkles size={20} className="text-cyan-400" />
          </div>
        </motion.button>
      </motion.div>

      <footer className="mt-8 flex justify-between items-center z-10 border-t border-white/10 pt-6">
        <div className="text-[10px] text-white/30 uppercase font-bold tracking-[0.3em]">Built for the Spontaneous</div>
        <div className="flex gap-6 text-[10px] text-white/40 uppercase font-bold tracking-widest font-mono">
          <span>v2.0.0</span>
          <span>Encrypted</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-10 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
      <div className="mb-6 p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
