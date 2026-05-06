import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  collection, onSnapshot, addDoc, query,
  orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, SessionData, WallMoment } from '../types';

interface Props {
  profile: UserProfile;
  onOpenPlan?: (id: string, status: string) => void;
}

export default function WallTab({ profile, onOpenPlan }: Props) {
  const [moments, setMoments] = useState<WallMoment[]>([]);
  const [pastPlans, setPastPlans] = useState<SessionData[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎉');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const EMOJI_OPTIONS = ['🎉', '🏖️', '🍕', '🌍', '🎮', '🏕️', '🎬', '🌙', '🥂', '🏆', '🫂', '🔥'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'wall'), orderBy('createdAt', 'desc')),
      snap => setMoments(snap.docs.map(d => ({ id: d.id, ...d.data() } as WallMoment)))
    );
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'sessions'),
      where('status', 'in', ['confirmed', 'revealed']),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, snap => {
      setPastPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionData)));
    });
    return unsub;
  }, []);

  const saveMemory = async () => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    const today = new Date();
    const dateStr = `${today.getDate()} ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`;
    await addDoc(collection(db, 'wall'), {
      title: newTitle.trim(),
      emoji: newEmoji,
      date: dateStr,
      note: newNote.trim() || null,
      createdAt: serverTimestamp(),
      addedBy: profile.gangName,
    });
    setNewTitle('');
    setNewNote('');
    setAdding(false);
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-4 overflow-y-auto gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-xs mb-1">The Gang</p>
          <h2
            className="text-2xl font-black uppercase tracking-tight text-gradient"
            style={{ fontFamily: 'Anton, sans-serif' }}
          >
            The Wall
          </h2>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="btn-icon text-xl"
        >
          {adding ? '×' : '+'}
        </button>
      </div>

      {/* Add memory form */}
      {adding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-5 flex flex-col gap-4"
        >
          <p className="text-sm font-bold text-white/70">Add a memory</p>

          {/* Emoji picker */}
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newEmoji === e ? 'bg-white/20 scale-110' : 'bg-white/5'}`}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="What happened? e.g. Rooftop night"
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
          />
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="One line caption (optional)"
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
          />
          <button
            onClick={saveMemory}
            disabled={!newTitle.trim() || saving}
            className="btn-primary w-full font-bold uppercase tracking-widest"
          >
            {saving ? 'Saving…' : 'Pin to the Wall 📌'}
          </button>
        </motion.div>
      )}

      {/* Manual moments */}
      {moments.length > 0 && (
        <div>
          <p className="label-xs mb-3">Pinned Memories</p>
          <div className="flex flex-col gap-3">
            {moments.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-start gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0">
                  {m.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{m.title}</p>
                  {m.note && (
                    <p className="text-white/50 text-sm mt-0.5 leading-relaxed">{m.note}</p>
                  )}
                  <p className="text-white/25 text-xs mt-1">{m.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past plans */}
      {pastPlans.length > 0 && (
        <div>
          <p className="label-xs mb-3">Past Hangouts</p>
          <div className="flex flex-col gap-2">
            {pastPlans.map((plan, i) => (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenPlan?.(plan.id, plan.status)}
                className="glass-card-sm p-4 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
              >
                <div>
                  <p className="text-sm font-bold">{plan.title}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {plan.members.length} crew · {plan.status}
                  </p>
                </div>
                <span className="text-white/20 text-lg">›</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {moments.length === 0 && pastPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-5xl">🗺️</span>
          <p className="text-white/40 text-sm">The wall is empty.</p>
          <p className="text-white/20 text-xs">Every hangout will live here forever.</p>
        </div>
      )}
    </div>
  );
}
