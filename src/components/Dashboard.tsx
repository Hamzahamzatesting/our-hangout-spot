import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Plus, LogOut, Clock, CheckCircle, Sparkles, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, SessionData } from '../types';
import { SOCIAL_COMMENTS, getAvatarByEmoji } from '../lib/avatars';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface Props {
  profile: UserProfile;
  onSelectSession: (id: string, status?: string, result?: any) => void;
  onCreatePlan: () => void;
}

export default function Dashboard({ profile, onSelectSession, onCreatePlan }: Props) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'sessions'),
      where('members', 'array-contains', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionData)));
      setLoading(false);
    }, err => {
      handleFirestoreError(err, OperationType.LIST, 'sessions');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const active = sessions.filter(s => s.status === 'collecting');
  const past = sessions.filter(s => s.status === 'confirmed' || s.status === 'revealed');

  // Fun social comment seeded by name
  const commentIndex = profile.displayName.charCodeAt(0) % SOCIAL_COMMENTS.length;
  const socialComment = SOCIAL_COMMENTS[commentIndex];

  const avatar = getAvatarByEmoji(profile.avatar);

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex items-center justify-between">
        <div>
          <p className="label-xs mb-1">Your space</p>
          <h1 className="text-3xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'Anton, sans-serif' }}>
            Hangout
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`avatar-bubble bg-gradient-to-br ${avatar.bg} text-xl`}>
            {profile.avatar}
          </div>
          <button
            onClick={() => auth.signOut()}
            className="btn-icon"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Profile card */}
      <div className="px-6 mb-6">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-3xl shrink-0`}>
            {profile.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">{profile.displayName}</p>
            <p className="text-white/40 text-xs mt-0.5 truncate">
              {profile.displayName} {socialComment}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-gradient">{profile.totalPlans ?? 0}</p>
            <p className="label-xs">plans</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 space-y-8">
        {/* Active plans */}
        {(loading || active.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              <p className="label-xs text-cyan-400">Active plans</p>
            </div>
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1, 2].map(i => (
                  <div key={i} className="h-24 rounded-[28px] shimmer mb-3" />
                ))
              ) : (
                active.map((s, i) => (
                  <SessionCard key={s.id} session={s} index={i} onClick={() => onSelectSession(s.id, s.status, s.result)} />
                ))
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Past plans / Memory */}
        {past.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={12} className="text-yellow-400" />
              <p className="label-xs text-yellow-400">Memory vault</p>
            </div>
            <div className="space-y-3">
              {past.slice(0, 5).map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectSession(s.id, s.status, s.result)}
                  className="w-full glass-card-sm p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors active:scale-[0.99]"
                >
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    {s.confirmedOptionText && (
                      <p className="text-white/40 text-xs truncate mt-0.5">→ {s.confirmedOptionText}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <p className="text-white/25 text-xs">
                      {s.createdAt?.seconds
                        ? new Date(s.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : ''}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Sparkles size={32} className="text-white/20" />
            </div>
            <p className="text-white/30 font-medium mb-2">No plans yet</p>
            <p className="text-white/20 text-sm">Create your first plan and invite your crew</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={onCreatePlan}
        className="fixed bottom-8 right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-fuchsia-600 rounded-[20px] flex items-center justify-center shadow-[0_8px_32px_rgba(34,211,238,0.35)] z-40"
      >
        <Plus size={28} strokeWidth={2.5} className="text-black" />
      </motion.button>
    </div>
  );
}

function SessionCard({ session, index, onClick }: { session: SessionData; index: number; onClick: () => void }) {
  const memberCount = session.members?.length ?? 0;
  const profiles = Object.values(session.memberProfiles ?? {}).slice(0, 4);

  return (
    <motion.button
      layout
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className="w-full glass-card p-5 text-left flex items-center gap-4 hover:bg-white/[0.04] active:scale-[0.99] transition-all mb-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {session.mysteryMode && (
            <span className="text-xs bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 px-2 py-0.5 rounded-full font-medium">
              🕵️ Mystery
            </span>
          )}
          <h3 className="font-bold text-base truncate">{session.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {session.date && (
            <span className="flex items-center gap-1 text-white/40 text-xs">
              <Clock size={10} />
              {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              {session.time && ` · ${session.time}`}
            </span>
          )}
        </div>
      </div>

      {/* Member avatars */}
      <div className="flex items-center shrink-0">
        <div className="flex -space-x-2">
          {profiles.map((p, i) => {
            const av = getAvatarByEmoji(p.avatar);
            return (
              <div key={i} className={`avatar-bubble-sm bg-gradient-to-br ${av.bg} text-sm`}>
                {p.avatar}
              </div>
            );
          })}
          {memberCount > 4 && (
            <div className="avatar-bubble-sm bg-white/10 text-[10px] font-bold">
              +{memberCount - 4}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
