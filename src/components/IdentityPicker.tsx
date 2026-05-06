import { useState } from 'react';
import { motion } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { GANG } from '../lib/gang';
import { UserProfile } from '../types';

interface Props {
  user: User;
  onPicked: (profile: UserProfile) => void;
}

export default function IdentityPicker({ user, onPicked }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    const member = GANG.find(m => m.name === selected)!;
    const profile: UserProfile = {
      uid: user.uid,
      gangName: member.name,
      displayName: member.name,
      avatar: member.emoji,
      avatarName: member.name,
      avatarBg: member.bg,
      dropCount: 0,
      planCount: 0,
      reactCount: 0,
      missedCount: 0,
    };
    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      lastActive: serverTimestamp(),
    });
    onPicked(profile);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-10 relative">
      <div className="atmosphere" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <p className="label-xs mb-3">Welcome to</p>
        <h1
          className="text-5xl font-black uppercase tracking-tight text-gradient mb-2"
          style={{ fontFamily: 'Anton, sans-serif' }}
        >
          The Gang HQ
        </h1>
        <p className="text-white/40 text-sm">Who are you?</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-3 w-full max-w-xs z-10"
      >
        {GANG.map((member, i) => (
          <motion.button
            key={member.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i + 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(member.name)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
              selected === member.name
                ? 'border-white/30 bg-white/10 shadow-lg'
                : 'border-white/8 bg-white/[0.03]'
            }`}
            style={
              selected === member.name
                ? { boxShadow: `0 0 24px ${member.shadow}` }
                : {}
            }
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.bg} flex items-center justify-center text-2xl shrink-0 shadow-lg`}
              style={{ boxShadow: `0 4px 20px ${member.shadow}` }}
            >
              {member.emoji}
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-lg">{member.name}</p>
              <p className="text-white/30 text-xs">Gang member</p>
            </div>
            {selected === member.name && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-xs"
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0.3 }}
        className="w-full max-w-xs z-10"
      >
        <button
          className="btn-primary w-full text-lg font-black uppercase tracking-widest"
          disabled={!selected || saving}
          onClick={handleConfirm}
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            `I'm ${selected ?? '...'}`
          )}
        </button>
      </motion.div>
    </div>
  );
}
