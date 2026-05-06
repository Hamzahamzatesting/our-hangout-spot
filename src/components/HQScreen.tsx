import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  collection, onSnapshot, query, orderBy, limit,
  doc, updateDoc, serverTimestamp, where, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { GANG, getMember } from '../lib/gang';
import { UserProfile, Drop, SessionData } from '../types';

interface Props {
  profile: UserProfile;
}

interface MemberActivity {
  name: string;
  lastActive?: Date;
  isOnline: boolean;
}

export default function HQScreen({ profile }: Props) {
  const [activity, setActivity] = useState<MemberActivity[]>([]);
  const [latestDrop, setLatestDrop] = useState<Drop | null>(null);
  const [activePlans, setActivePlans] = useState<SessionData[]>([]);
  const [gangEnergy, setGangEnergy] = useState(0);

  // Ping last active on mount
  useEffect(() => {
    updateDoc(doc(db, 'users', profile.uid), {
      lastActive: serverTimestamp(),
    }).catch(() => {});
  }, [profile.uid]);

  // Watch all users' lastActive
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const now = Date.now();
      const members: MemberActivity[] = GANG.map(g => {
        const userDoc = snap.docs.find(
          d => d.data().gangName === g.name
        );
        const ts: Timestamp | undefined = userDoc?.data()?.lastActive;
        const lastActive = ts ? ts.toDate() : undefined;
        const isOnline = lastActive
          ? now - lastActive.getTime() < 5 * 60 * 1000
          : false;
        return { name: g.name, lastActive, isOnline };
      });
      setActivity(members);

      // Gang energy: % of members active in last 24h
      const activeCount = members.filter(
        m => m.lastActive && now - m.lastActive.getTime() < 24 * 60 * 60 * 1000
      ).length;
      setGangEnergy(Math.round((activeCount / GANG.length) * 100));
    });
    return unsub;
  }, []);

  // Latest drop
  useEffect(() => {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'drops'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        setLatestDrop({ id: snap.docs[0].id, ...snap.docs[0].data() } as Drop);
      } else {
        setLatestDrop(null);
      }
    });
    return unsub;
  }, []);

  // Active plans
  useEffect(() => {
    const q = query(
      collection(db, 'sessions'),
      where('status', '==', 'collecting'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsub = onSnapshot(q, snap => {
      setActivePlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionData)));
    });
    return unsub;
  }, []);

  const onlineCount = activity.filter(m => m.isOnline).length;

  function timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-4 gap-5 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-xs">Welcome back</p>
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Anton, sans-serif' }}>
            <span className="text-gradient">The Gang</span> HQ
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass-card-sm">
          {onlineCount > 0 && <span className="presence-dot" />}
          <span className="text-xs text-white/60">
            {onlineCount > 0 ? `${onlineCount} online` : 'all quiet'}
          </span>
        </div>
      </div>

      {/* Gang avatars */}
      <div className="glass-card p-5">
        <p className="label-xs mb-4">The Crew</p>
        <div className="flex justify-between">
          {GANG.map((member, i) => {
            const memberActivity = activity.find(a => a.name === member.name);
            const isMe = member.name === profile.gangName;
            const isOnline = memberActivity?.isOnline ?? false;
            return (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <motion.div
                    animate={isOnline ? {
                      boxShadow: [
                        `0 0 0px ${member.shadow}`,
                        `0 0 18px ${member.shadow}`,
                        `0 0 0px ${member.shadow}`,
                      ]
                    } : {}}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.bg} flex items-center justify-center text-2xl
                      ${isMe ? 'ring-2 ring-white/40' : ''}`}
                  >
                    {member.emoji}
                  </motion.div>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#050505] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  )}
                  {isMe && (
                    <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                  )}
                </div>
                <span className="text-[10px] text-white/50 font-medium">{member.name}</span>
                {memberActivity?.lastActive && !isOnline && (
                  <span className="text-[9px] text-white/25">{timeAgo(memberActivity.lastActive)}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gang Energy */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label-xs">Gang Energy</p>
          <span className="text-sm font-bold text-gradient">{gangEnergy}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${gangEnergy}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
          />
        </div>
        <p className="text-white/25 text-[10px] mt-2">
          {gangEnergy >= 80
            ? '🔥 The gang is fully activated'
            : gangEnergy >= 40
            ? '⚡ Some energy in the room'
            : '😴 The gang has gone quiet'}
        </p>
      </div>

      {/* Latest Drop */}
      {latestDrop && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="label-xs mb-3">Latest Drop</p>
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getMember(latestDrop.authorName).bg} flex items-center justify-center text-lg shrink-0`}
            >
              {latestDrop.authorEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold">{latestDrop.authorName}</span>
                <span className="text-white/25 text-[10px]">
                  {latestDrop.createdAt
                    ? timeAgo(latestDrop.createdAt.toDate())
                    : ''}
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed truncate">
                {latestDrop.content}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Plans */}
      {activePlans.length > 0 && (
        <div>
          <p className="label-xs mb-3">Cooking 🍳</p>
          <div className="flex flex-col gap-2">
            {activePlans.map(plan => (
              <div key={plan.id} className="glass-card-sm px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{plan.title}</p>
                  <p className="text-white/30 text-xs">{plan.members.length} crew</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Voting
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!latestDrop && activePlans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center justify-center py-10 gap-3 text-center"
        >
          <span className="text-5xl">🌑</span>
          <p className="text-white/40 text-sm">The HQ is quiet.</p>
          <p className="text-white/25 text-xs">Drop something or start a plan.</p>
        </motion.div>
      )}
    </div>
  );
}
