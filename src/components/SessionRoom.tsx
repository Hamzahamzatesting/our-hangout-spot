import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Sparkles, UserPlus } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { synthesizeVibes } from '../services/geminiService';

export default function SessionRoom({ sessionId, onBack }: { sessionId: string, onBack: () => void }) {
  const [session, setSession] = useState<any>(null);
  const [vibes, setVibes] = useState<any[]>([]);
  const [myVibe, setMyVibe] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const unsubSession = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
      setSession({ id: doc.id, ...doc.data() });
    }, (err) => handleFirestoreError(err, OperationType.GET, `sessions/${sessionId}`));

    const unsubVibes = onSnapshot(collection(db, 'sessions', sessionId, 'vibes'), (snap) => {
      setVibes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `sessions/${sessionId}/vibes`));

    return () => {
      unsubSession();
      unsubVibes();
    };
  }, [sessionId]);

  const submitVibe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myVibe.trim() || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'sessions', sessionId, 'vibes'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        content: myVibe,
        type: 'text',
        createdAt: serverTimestamp()
      });
      setMyVibe('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `sessions/${sessionId}/vibes`);
    }
  };

  const startSynthesis = async () => {
    if (!session || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const result = await synthesizeVibes(vibes);
      if (result) {
        await updateDoc(doc(db, 'sessions', sessionId), {
          status: 'revealed',
          result: result
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}?session=${sessionId}`; // Simple mock for now
    navigator.clipboard.writeText(url);
    alert('Invite link copied! Send it to your friends.');
  };

  if (!session) return <div className="p-12 text-center opacity-20">Summoning Ritual...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <div className="atmosphere" />
      
      <header className="p-6 flex items-center justify-between z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={onBack} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:text-cyan-400 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mb-1">Ritual Session</div>
          <h2 className="text-2xl font-black uppercase tracking-tight italic leading-none">{session.title}</h2>
        </div>
        <button onClick={copyLink} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:text-fuchsia-400 transition-colors">
          <UserPlus size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 reveal-mask z-10 py-12">
        <AnimatePresence>
          {vibes.map((vibe) => (
            <motion.div
              layout
              key={vibe.id}
              initial={{ x: vibe.userId === auth.currentUser?.uid ? 20 : -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`flex flex-col ${vibe.userId === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{vibe.userName}</span>
                <div className={`w-1 h-1 rounded-full ${vibe.userId === auth.currentUser?.uid ? 'bg-fuchsia-400' : 'bg-cyan-400'}`} />
              </div>
              <div className={`p-6 max-w-[85%] text-lg font-medium tracking-tight ${
                vibe.userId === auth.currentUser?.uid 
                ? 'bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-[28px] rounded-tr-none shadow-lg shadow-fuchsia-500/10' 
                : 'bg-white/5 border border-white/10 backdrop-blur-md rounded-[28px] rounded-tl-none'
              }`}>
                {vibe.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {vibes.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/10 pt-32">
            <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/10 animate-spin-slow flex items-center justify-center mb-6">
              <Sparkles size={32} />
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.4em]">Awaiting Resonance</p>
          </div>
        )}
      </main>

      <footer className="p-8 bg-black/60 backdrop-blur-3xl border-t border-white/10 z-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <form onSubmit={submitVibe} className="relative group">
            <input
              value={myVibe}
              onChange={(e) => setMyVibe(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-6 pr-20 focus:outline-none focus:border-cyan-500 transition-all font-medium placeholder:text-white/20"
              placeholder="Stream your consciousness..."
            />
            <button type="submit" className="absolute right-3 top-3 bottom-3 w-14 bg-white text-black rounded-[20px] flex items-center justify-center group-hover:bg-cyan-400 transition-colors">
              <Send size={24} />
            </button>
          </form>

          {auth.currentUser?.uid === session.hostId && vibes.length >= 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startSynthesis}
              disabled={isSynthesizing}
              className="noctua-btn w-full relative overflow-hidden"
            >
              {isSynthesizing && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              <span className="text-xl font-black uppercase tracking-[0.2em] relative z-10">
                {isSynthesizing ? 'Consulting Oracle' : 'Forge Fate'}
              </span>
              {!isSynthesizing && <Sparkles size={20} className="relative z-10" />}
            </motion.button>
          )}
        </div>
      </footer>
    </div>
  );
}
