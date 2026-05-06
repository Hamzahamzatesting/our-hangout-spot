import { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { AVATARS, Avatar, CREW_ROLES, CrewRole } from '../lib/avatars';
import { UserProfile } from '../types';

interface Props {
  user: User;
  onSaved: (profile: UserProfile) => void;
}

export default function AvatarPicker({ user, onSaved }: Props) {
  const [selected, setSelected] = useState<Avatar | null>(null);
  const [role, setRole] = useState<CrewRole | null>(null);
  const [name, setName] = useState(user.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!selected) { setError('Pick your cartoon face first'); return; }
    if (!name.trim()) { setError('Enter your full name'); return; }
    if (!role) { setError('Pick your crew role'); return; }
    setSaving(true);
    setError('');

    const profile: UserProfile = {
      uid: user.uid,
      gangName: name.trim(),
      displayName: name.trim(),
      avatar: selected.emoji,
      avatarName: selected.name,
      avatarBg: selected.bg,
      crewRole: role.label,
      crewRoleEmoji: role.emoji,
      crewRoleLine: role.line,
      totalPlans: 0,
    };

    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        avatar: profile.avatar,
        avatarName: profile.avatarName,
        avatarBg: profile.avatarBg,
        crewRole: profile.crewRole,
        crewRoleEmoji: profile.crewRoleEmoji,
        crewRoleLine: profile.crewRoleLine,
        totalPlans: 0,
        lastActive: serverTimestamp(),
      });
      onSaved(profile);
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        setError('Profile save is blocked by Firestore rules. Publish the users rule in Firebase.');
      } else {
        setError(e?.message ?? 'Could not save — try again');
      }
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col gap-8 max-w-md mx-auto w-full"
      >
        {/* Header */}
        <div>
          <p className="label-xs mb-2">Step 1 of 1</p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-gradient"
              style={{ fontFamily: 'Anton, sans-serif' }}>
            Make your card
          </h1>
          <p className="text-white/40 text-sm mt-2">Full name, cartoon face, and crew role are required to enter</p>
        </div>

        {/* Avatar grid */}
        <div className="grid grid-cols-5 gap-3">
          {AVATARS.map((a) => (
            <motion.button
              key={a.emoji}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelected(a)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 relative overflow-hidden
                ${selected?.emoji === a.emoji
                  ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#050505]'
                  : 'bg-white/5 border border-white/10 hover:bg-white/8'
                }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${a.bg} ${selected?.emoji === a.emoji ? 'opacity-30' : 'opacity-0'} transition-opacity`} />
              <span className="text-2xl relative z-10">{a.emoji}</span>
            </motion.button>
          ))}
        </div>

        {/* Selected name display */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 glass-card-sm p-4"
            >
              <div className={`avatar-bubble bg-gradient-to-br ${selected.bg} text-2xl w-14 h-14`}>
                {selected.emoji}
              </div>
              <div>
                <p className="font-bold text-white">{selected.name}</p>
                <p className="text-white/40 text-xs">Your cartoon face</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crew role */}
        <div>
          <label className="label-xs block mb-2">Crew role</label>
          <div className="grid grid-cols-2 gap-2">
            {CREW_ROLES.map((r) => (
              <motion.button
                key={r.label}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setRole(r)}
                className={`min-h-16 rounded-2xl border px-3 py-3 text-left transition-all ${
                  role?.label === r.label
                    ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.emoji}</span>
                  <span className="font-bold text-white text-sm">{r.label}</span>
                </div>
                <p className="text-white/35 text-[11px] mt-1">{r.line}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="label-xs block mb-2">Full name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            placeholder="Enter your full name"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500 transition-colors text-base"
          />
        </div>

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

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving || !selected || !role || !name.trim()}
          className="btn-primary w-full text-base font-black uppercase tracking-widest mt-auto"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            'Join the crew →'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
