import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  query, orderBy, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getMember } from '../lib/gang';
import { UserProfile, Drop } from '../types';

const REACTIONS = ['🔥', '😂', '💀', '👀', '❤️', '🫡'];
const VIBES = ['🏖️ Beach', '🍕 Food run', '🎮 Gaming', '🎉 Party', '🚗 Road trip', '🎬 Cinema', '🏠 Stay in', '🌙 Late night'];

interface Props {
  profile: UserProfile;
}

export default function DropsTab({ profile }: Props) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [reactingId, setReactingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const member = getMember(profile.gangName);

  useEffect(() => {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'drops'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, snap => {
      setDrops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Drop)));
    });
    return unsub;
  }, []);

  const postDrop = async (content: string, type: Drop['type'] = 'text') => {
    if (!content.trim() || posting) return;
    setPosting(true);
    const now = Timestamp.now();
    const expires = Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000));
    await addDoc(collection(db, 'drops'), {
      type,
      content: content.trim(),
      authorName: profile.gangName,
      authorEmoji: member.emoji,
      authorBg: member.bg,
      createdAt: serverTimestamp(),
      expiresAt: expires,
      pinned: false,
      reactions: {},
    });
    setText('');
    setPosting(false);
    setShowVibePicker(false);
  };

  const react = async (dropId: string, emoji: string) => {
    const ref = doc(db, 'drops', dropId);
    await updateDoc(ref, { [`reactions.${profile.gangName}`]: emoji });
    setReactingId(null);
  };

  const togglePin = async (drop: Drop) => {
    if (!drop.id) return;
    await updateDoc(doc(db, 'drops', drop.id), { pinned: !drop.pinned });
  };

  function timeLeft(expiresAt: any): string {
    if (!expiresAt) return '';
    const diff = Math.floor((expiresAt.toDate().getTime() - Date.now()) / 1000);
    if (diff <= 0) return 'expired';
    if (diff < 3600) return `${Math.floor(diff / 60)}m left`;
    return `${Math.floor(diff / 3600)}h left`;
  }

  function timeAgo(createdAt: any): string {
    if (!createdAt) return '';
    const diff = Math.floor((Date.now() - createdAt.toDate().getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  const pinnedDrops = drops.filter(d => d.pinned);
  const liveDrops = drops.filter(d => !d.pinned);

  return (
    <div className="flex flex-col h-full">

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Anton, sans-serif' }}>
            Drops
          </h2>
          <span className="text-xs text-white/30">vanish in 48h</span>
        </div>

        {/* Pinned */}
        {pinnedDrops.length > 0 && (
          <div className="mb-5">
            <p className="label-xs mb-3">📌 Pinned</p>
            <div className="flex flex-col gap-2">
              {pinnedDrops.map(drop => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  myName={profile.gangName}
                  reactingId={reactingId}
                  setReactingId={setReactingId}
                  onReact={react}
                  onPin={togglePin}
                  timeLeft={timeLeft}
                  timeAgo={timeAgo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live drops */}
        {liveDrops.length > 0 ? (
          <div className="flex flex-col gap-3">
            {liveDrops.map(drop => (
              <DropCard
                key={drop.id}
                drop={drop}
                myName={profile.gangName}
                reactingId={reactingId}
                setReactingId={setReactingId}
                onReact={react}
                onPin={togglePin}
                timeLeft={timeLeft}
                timeAgo={timeAgo}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-5xl">💧</span>
            <p className="text-white/40 text-sm">Nothing dropped yet.</p>
            <p className="text-white/20 text-xs">Be the first one.</p>
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="px-5 pb-4 pt-3 border-t border-white/5">
        <AnimatePresence>
          {showVibePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="grid grid-cols-4 gap-2">
                {VIBES.map(v => (
                  <button
                    key={v}
                    onClick={() => postDrop(v, 'vibe')}
                    className="text-xs py-2 px-1 glass-card-sm text-center text-white/70 active:scale-95 transition-transform"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${member.bg} flex items-center justify-center text-base shrink-0`}
          >
            {member.emoji}
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 h-11">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postDrop(text)}
              placeholder="Drop something…"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            />
            <button
              onClick={() => setShowVibePicker(v => !v)}
              className="text-base text-white/30 hover:text-white/60 transition-colors"
            >
              🎯
            </button>
          </div>
          <button
            onClick={() => postDrop(text)}
            disabled={!text.trim() || posting}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center text-lg disabled:opacity-30 active:scale-95 transition-transform shrink-0"
          >
            {posting ? '…' : '↑'}
          </button>
        </div>
      </div>
    </div>
  );
}

const DropCard: React.FC<{
  drop: Drop;
  myName: string;
  reactingId: string | null;
  setReactingId: (id: string | null) => void;
  onReact: (id: string, emoji: string) => void;
  onPin: (drop: Drop) => void;
  timeLeft: (ts: any) => string;
  timeAgo: (ts: any) => string;
}> = function DropCard({ drop, myName, reactingId, setReactingId, onReact, onPin, timeLeft, timeAgo }) {
  const member = getMember(drop.authorName);
  const myReaction = drop.reactions?.[myName];
  const allReactions = Object.entries(drop.reactions ?? {});
  const isVibe = drop.type === 'vibe';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 ${drop.pinned ? 'border-white/20' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${member.bg} flex items-center justify-center text-lg shrink-0`}
          style={{ boxShadow: `0 4px 14px ${member.shadow}` }}
        >
          {drop.authorEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold">{drop.authorName}</span>
            <span className="text-white/25 text-[10px]">{timeAgo(drop.createdAt)}</span>
            <span className="ml-auto text-[10px] text-white/20">{timeLeft(drop.expiresAt)}</span>
          </div>
          <p className={`text-sm leading-relaxed ${isVibe ? 'text-lg' : 'text-white/80'}`}>
            {drop.content}
          </p>
        </div>
      </div>

      {/* Reactions row */}
      <div className="flex items-center gap-2 mt-3">
        {/* Existing reactions */}
        {allReactions.length > 0 && (
          <div className="flex gap-1 flex-wrap flex-1">
            {Object.entries(
              allReactions.reduce((acc, [, emoji]) => {
                const e = emoji as string;
                acc[e] = (acc[e] ?? 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <span
                key={emoji}
                className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* React button */}
          <button
            onClick={() => setReactingId(reactingId === drop.id ? null : drop.id ?? null)}
            className={`text-base px-2 py-1 rounded-xl transition-colors ${myReaction ? 'bg-white/10' : 'text-white/30 hover:text-white/60'}`}
          >
            {myReaction ?? '＋'}
          </button>
          {/* Pin button */}
          <button
            onClick={() => onPin(drop)}
            className={`text-sm px-2 py-1 rounded-xl transition-colors ${drop.pinned ? 'text-yellow-400' : 'text-white/20 hover:text-white/50'}`}
          >
            📌
          </button>
        </div>
      </div>

      {/* Reaction picker */}
      <AnimatePresence>
        {reactingId === drop.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            className="mt-2 flex gap-2 justify-center bg-white/5 rounded-2xl p-2"
          >
            {REACTIONS.map(r => (
              <button
                key={r}
                onClick={() => onReact(drop.id!, r)}
                className="text-xl active:scale-110 transition-transform"
              >
                {r}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
