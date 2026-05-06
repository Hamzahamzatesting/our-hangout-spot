import { useState, FormEvent } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, X, Eye, EyeOff, Shuffle } from 'lucide-react';
import { MYSTERY_VIBES, getAvatarByEmoji } from '../lib/avatars';
import { UserProfile, MysteryVibe } from '../types';

interface Props {
  profile: UserProfile;
  onCreated: (sessionId: string) => void;
  onBack: () => void;
}

const RANDOM_TITLES = [
  'Friday Night Out 🔥', 'Weekend Plans 🗓️', 'Dinner Plans 🍽️',
  "Let's do something", 'Weekend vibes 🌙', 'Saturday Shenanigans',
];

export default function CreatePlan({ profile, onCreated, onBack }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [mysteryMode, setMysteryMode] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<MysteryVibe | null>(null);
  const [destination, setDestination] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => setOptions(o => [...o, '']);
  const removeOption = (i: number) => setOptions(o => o.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions(o => o.map((v, idx) => idx === i ? val : v));

  const randomTitle = () => setTitle(RANDOM_TITLES[Math.floor(Math.random() * RANDOM_TITLES.length)]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Give your plan a name'); return; }
    if (mysteryMode && !selectedVibe) { setError('Pick a vibe for mystery mode'); return; }
    if (!mysteryMode) {
      const filled = options.filter(o => o.trim());
      if (filled.length < 1) { setError('Add at least one option'); return; }
    }
    if (!auth.currentUser) return;

    setCreating(true);
    setError('');

    try {
      const uid = auth.currentUser.uid;
      const avatar = getAvatarByEmoji(profile.avatar);

      const sessionRef = await addDoc(collection(db, 'sessions'), {
        title: title.trim(),
        date: date || null,
        time: time || null,
        status: 'collecting',
        hostId: uid,
        members: [uid],
        memberProfiles: {
          [uid]: {
            name: profile.displayName,
            avatar: profile.avatar,
            avatarBg: avatar.bg,
            crewRole: profile.crewRole,
            crewRoleEmoji: profile.crewRoleEmoji,
          },
        },
        mysteryMode,
        mysteryVibe: mysteryMode ? selectedVibe : null,
        mysteryDestination: mysteryMode ? (destination.trim() || null) : null,
        confirmedOptionId: null,
        confirmedOptionText: null,
        createdAt: serverTimestamp(),
      });

      // Add initial options (non-mystery mode)
      if (!mysteryMode) {
        const filledOptions = options.filter(o => o.trim());
        await Promise.all(filledOptions.map(text =>
          addDoc(collection(db, 'sessions', sessionRef.id, 'options'), {
            text: text.trim(),
            createdBy: uid,
            voters: [],
            addedAt: serverTimestamp(),
          })
        ));
      }

      // Increment totalPlans on user
      updateDoc(doc(db, 'users', uid), { totalPlans: increment(1) }).catch(() => {});

      onCreated(sessionRef.id);
    } catch (err: any) {
      setError('Could not create plan. Try again.');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center gap-4">
        <button onClick={onBack} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="label-xs">New plan</p>
          <h1 className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'Anton, sans-serif' }}>
            What's the vibe?
          </h1>
        </div>
      </header>

      <form onSubmit={create} className="flex-1 flex flex-col px-6 pb-10 gap-6 overflow-y-auto">

        {/* Title */}
        <div>
          <label className="label-xs block mb-2">Plan name</label>
          <div className="relative">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={60}
              placeholder="Friday Night Out…"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={randomTitle}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Random idea"
            >
              <Shuffle size={16} className="text-white/50" />
            </button>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-xs block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="label-xs block mb-2">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Mystery Mode toggle */}
        <div className="glass-card-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{mysteryMode ? '🕵️' : '👁️'}</span>
              <div>
                <p className="font-bold text-sm">Mystery Mode</p>
                <p className="text-white/40 text-xs mt-0.5">Hide the destination until you reveal it</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMysteryMode(m => !m)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${mysteryMode ? 'bg-fuchsia-600' : 'bg-white/15'}`}
            >
              <motion.div
                animate={{ x: mysteryMode ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>
        </div>

        {/* Mystery vibe picker */}
        <AnimatePresence>
          {mysteryMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <label className="label-xs block mb-3">Vibe (what your crew sees)</label>
                <div className="grid grid-cols-4 gap-2">
                  {MYSTERY_VIBES.map(v => (
                    <button
                      key={v.emoji}
                      type="button"
                      onClick={() => setSelectedVibe(v)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all active:scale-95 ${
                        selectedVibe?.emoji === v.emoji
                          ? 'border-fuchsia-500 bg-fuchsia-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/8'
                      }`}
                    >
                      <span className="text-2xl">{v.emoji}</span>
                      <span className="text-[9px] text-white/50 text-center leading-tight">{v.label}</span>
                      <span className="text-[9px] text-white/30">{v.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-xs block mb-2">Secret destination (only you see this)</label>
                <div className="relative">
                  <input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    maxLength={100}
                    placeholder="The real location…"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-12 text-white placeholder:text-white/25 focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                  <EyeOff size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
                <p className="text-white/25 text-xs mt-1.5 pl-1">Your friends won't see this until you reveal it</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options (normal mode) */}
        <AnimatePresence>
          {!mysteryMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <label className="label-xs block">Options to vote on</label>
              <AnimatePresence mode="popLayout">
                {options.map((opt, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex gap-2"
                  >
                    <input
                      value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                      maxLength={80}
                      placeholder={`Option ${i + 1}…`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="btn-icon text-white/40 hover:text-red-400 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="w-full py-3 rounded-2xl border border-dashed border-white/15 flex items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:border-white/25 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add option
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Create button */}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={creating}
          className="btn-primary w-full text-base font-black uppercase tracking-widest mt-auto"
        >
          {creating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              {mysteryMode ? '🕵️' : '🚀'} Create Plan
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
