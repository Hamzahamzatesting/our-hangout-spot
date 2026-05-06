import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  doc, collection, onSnapshot, addDoc, updateDoc,
  serverTimestamp, arrayUnion, arrayRemove, runTransaction,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Link2, Send, Plus, Crown, Check, MessageCircle,
  X, Eye, Shuffle, Lock, CheckCircle2,
} from 'lucide-react';
import { UserProfile, SessionData, PlanOption, ChatMessage } from '../types';
import { getAvatarByEmoji } from '../lib/avatars';

interface Props {
  sessionId: string;
  profile: UserProfile;
  onBack: () => void;
}

export default function SessionRoom({ sessionId, profile, onBack }: Props) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [options, setOptions] = useState<PlanOption[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [optionInput, setOptionInput] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revealingMystery, setRevealingMystery] = useState(false);
  const [rsvp, setRsvp] = useState<string | null>(null); // 'in' | 'out' | null
  const chatEndRef = useRef<HTMLDivElement>(null);

  const uid = auth.currentUser?.uid ?? '';
  const isHost = session?.hostId === uid;

  // Real-time session
  useEffect(() => {
    return onSnapshot(doc(db, 'sessions', sessionId), snap => {
      if (snap.exists()) setSession({ id: snap.id, ...snap.data() } as SessionData);
    });
  }, [sessionId]);

  // Real-time options
  useEffect(() => {
    return onSnapshot(collection(db, 'sessions', sessionId, 'options'), snap => {
      setOptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanOption)));
    });
  }, [sessionId]);

  // Real-time messages
  useEffect(() => {
    return onSnapshot(collection(db, 'sessions', sessionId, 'messages'), snap => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ChatMessage))
        .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      setMessages(msgs);
    });
  }, [sessionId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  // Determine user's current vote
  const userVoteId = options.find(o => o.voters.includes(uid))?.id ?? null;

  // Sorted options by vote count
  const sortedOptions = [...options].sort((a, b) => b.voters.length - a.voters.length);
  const maxVotes = sortedOptions[0]?.voters.length ?? 0;
  const totalVotes = options.reduce((sum, o) => sum + o.voters.length, 0);

  const vote = useCallback(async (optionId: string) => {
    if (isVoting || !uid) return;
    setIsVoting(true);
    try {
      const isSameOption = userVoteId === optionId;
      // Remove from previous vote
      if (userVoteId) {
        await updateDoc(doc(db, 'sessions', sessionId, 'options', userVoteId), {
          voters: arrayRemove(uid),
        });
      }
      // Add to new option (unless toggling off)
      if (!isSameOption) {
        await updateDoc(doc(db, 'sessions', sessionId, 'options', optionId), {
          voters: arrayUnion(uid),
        });
      }
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setIsVoting(false);
    }
  }, [isVoting, uid, userVoteId, sessionId]);

  const addOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionInput.trim() || !uid) return;
    await addDoc(collection(db, 'sessions', sessionId, 'options'), {
      text: optionInput.trim(),
      createdBy: uid,
      voters: [],
      addedAt: serverTimestamp(),
    });
    setOptionInput('');
    setShowAddOption(false);
  };

  const confirmPlan = async (option: PlanOption) => {
    setConfirmingId(option.id);
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'confirmed',
        confirmedOptionId: option.id,
        confirmedOptionText: option.text,
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const confirmMystery = async () => {
    setConfirmingId('mystery');
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { status: 'confirmed' });
    } finally {
      setConfirmingId(null);
    }
  };

  const revealMystery = async () => {
    setRevealingMystery(true);
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { status: 'revealed' });
    } finally {
      setRevealingMystery(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !uid) return;
    const text = chatInput.trim();
    setChatInput('');
    await addDoc(collection(db, 'sessions', sessionId, 'messages'), {
      userId: uid,
      userName: profile.displayName,
      avatarEmoji: profile.avatar,
      text,
      createdAt: serverTimestamp(),
    });
  };

  const copyLink = async () => {
    const link = `${window.location.origin}?join=${sessionId}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-600"
        />
      </div>
    );
  }

  const isConfirmed = session.status === 'confirmed' || session.status === 'revealed';
  const isMystery = session.mysteryMode;
  const members = Object.values(session.memberProfiles ?? {}) as import('../types').MemberProfile[];
  const unread = chatOpen ? 0 : messages.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-30">
        <button onClick={onBack} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isMystery && <span className="text-sm">🕵️</span>}
            <h2 className="font-black text-lg uppercase tracking-tight truncate"
                style={{ fontFamily: 'Anton, sans-serif' }}>
              {session.title}
            </h2>
          </div>
          {session.date && (
            <p className="text-white/40 text-xs mt-0.5">
              {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              {session.time && ` · ${session.time}`}
            </p>
          )}
        </div>
        <button
          onClick={copyLink}
          className={`btn-icon transition-colors ${linkCopied ? 'text-cyan-400 border-cyan-400/30' : ''}`}
          title="Copy invite link"
        >
          {linkCopied ? <Check size={18} /> : <Link2 size={18} />}
        </button>
      </header>

      {/* ── Member presence bar ─────────────────────────────────────────────── */}
      <div className="px-5 py-3 flex items-center gap-2 border-b border-white/[0.04]">
        <div className="flex -space-x-2 items-center">
          {members.slice(0, 6).map((m, i) => {
            const av = getAvatarByEmoji(m.avatar);
            return (
              <div key={i} className={`avatar-bubble-sm bg-gradient-to-br ${av.bg}`}>
                {m.avatar}
              </div>
            );
          })}
          {members.length > 6 && (
            <div className="avatar-bubble-sm bg-white/10 text-[10px] font-bold">
              +{members.length - 6}
            </div>
          )}
        </div>
        <span className="text-white/30 text-xs">{members.length} in this plan</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="presence-dot" />
          <span className="text-white/30 text-xs">Live</span>
        </div>
      </div>

      {/* ── Main scroll area ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-5 py-6 space-y-4">

        {/* CONFIRMED state */}
        {isConfirmed && (
          <ConfirmedBanner session={session} isHost={isHost} onReveal={revealMystery} revealLoading={revealingMystery} />
        )}

        {/* MYSTERY MODE (not yet confirmed) */}
        {!isConfirmed && isMystery && session.mysteryVibe && (
          <MysteryVibeCard
            vibe={session.mysteryVibe}
            rsvp={rsvp}
            onRsvp={setRsvp}
            isHost={isHost}
            onConfirm={confirmMystery}
            confirmLoading={confirmingId === 'mystery'}
          />
        )}

        {/* NORMAL VOTING */}
        {!isConfirmed && !isMystery && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="label-xs">{totalVotes} votes cast</p>
              {userVoteId && (
                <span className="text-xs text-fuchsia-400 font-medium">You voted ✓</span>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {sortedOptions.map((option, i) => (
                <VoteCard
                  key={option.id}
                  option={option}
                  index={i}
                  isLeading={option.voters.length === maxVotes && maxVotes > 0}
                  isMyVote={userVoteId === option.id}
                  totalVotes={totalVotes}
                  profiles={session.memberProfiles}
                  onVote={() => vote(option.id)}
                  isHost={isHost}
                  onConfirm={() => confirmPlan(option)}
                  confirmLoading={confirmingId === option.id}
                  disabled={isVoting}
                />
              ))}
            </AnimatePresence>

            {/* Add option */}
            <AnimatePresence>
              {showAddOption ? (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={addOption}
                  className="flex gap-2"
                >
                  <input
                    autoFocus
                    value={optionInput}
                    onChange={e => setOptionInput(e.target.value)}
                    maxLength={80}
                    placeholder="Another option…"
                    className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  />
                  <button type="submit" className="btn-icon text-cyan-400 border-cyan-400/20">
                    <Check size={18} />
                  </button>
                  <button type="button" onClick={() => setShowAddOption(false)} className="btn-icon">
                    <X size={18} />
                  </button>
                </motion.form>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowAddOption(true)}
                  className="w-full py-3.5 rounded-2xl border border-dashed border-white/10 flex items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors text-sm"
                >
                  <Plus size={15} />
                  Suggest another option
                </motion.button>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* ── Chat section ─────────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl">
        {/* Chat toggle */}
        <button
          onClick={() => setChatOpen(o => !o)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-white/40" />
            <span className="text-sm text-white/50 font-medium">
              Chat {messages.length > 0 && `· ${messages.length}`}
            </span>
          </div>
          <motion.div animate={{ rotate: chatOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={16} className="text-white/30" />
          </motion.div>
        </button>

        {/* Chat messages */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 280 }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="h-[280px] flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 reveal-mask">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-white/20 text-xs">No messages yet. Start the chat!</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <ChatBubble key={msg.id} msg={msg} isOwn={msg.userId === uid} />
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="px-5 pb-4 pt-2 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    maxLength={300}
                    placeholder="Say something…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button type="submit" disabled={!chatInput.trim()} className="btn-icon disabled:opacity-30">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Vote Card ─────────────────────────────────────────────────────────────── */
function VoteCard({
  option, index, isLeading, isMyVote, totalVotes, profiles,
  onVote, isHost, onConfirm, confirmLoading, disabled,
}: {
  key?: React.Key;
  option: PlanOption; index: number; isLeading: boolean; isMyVote: boolean;
  totalVotes: number; profiles: Record<string, any>;
  onVote: () => void; isHost: boolean;
  onConfirm: () => void; confirmLoading: boolean; disabled: boolean;
}) {
  const pct = totalVotes > 0 ? Math.round((option.voters.length / totalVotes) * 100) : 0;
  const voterProfiles = option.voters
    .slice(0, 5)
    .map(uid => profiles[uid])
    .filter(Boolean);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`vote-card ${isLeading ? 'vote-card-winner' : ''} ${isMyVote ? 'vote-card-voted' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Vote button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onVote}
          disabled={disabled}
          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all duration-200 ${
            isMyVote
              ? 'bg-fuchsia-600 text-white'
              : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white'
          }`}
        >
          {isLeading && !isMyVote
            ? <Crown size={16} className="text-cyan-400" />
            : isMyVote ? <Check size={18} /> : <Plus size={16} />}
        </motion.button>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isLeading ? 'text-white' : 'text-white/80'}`}>
            {option.text}
          </p>

          {/* Vote bar */}
          <div className="vote-bar mt-2 mb-1.5">
            <motion.div
              className={`vote-bar-fill ${isLeading ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600' : 'bg-white/30'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Voter avatars */}
            <div className="flex items-center gap-1">
              {voterProfiles.map((p, i) => {
                const av = getAvatarByEmoji(p.avatar);
                return (
                  <div key={i} className={`w-5 h-5 rounded-full bg-gradient-to-br ${av.bg} flex items-center justify-center text-[10px]`}>
                    {p.avatar}
                  </div>
                );
              })}
            </div>
            <span className="text-white/40 text-xs font-mono">
              {option.voters.length} vote{option.voters.length !== 1 ? 's' : ''} · {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Host confirm button */}
      {isHost && isLeading && option.voters.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          disabled={confirmLoading}
          className="mt-3 w-full h-10 bg-gradient-to-r from-cyan-500 to-fuchsia-600 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {confirmLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <><Lock size={14} /> Lock it in</>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Mystery Vibe Card ─────────────────────────────────────────────────────── */
function MysteryVibeCard({ vibe, rsvp, onRsvp, isHost, onConfirm, confirmLoading }: {
  vibe: { emoji: string; label: string; price: string };
  rsvp: string | null; onRsvp: (v: string) => void;
  isHost: boolean; onConfirm: () => void; confirmLoading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mystery-card min-h-[280px]">
      <div className="animate-spin-slow w-32 h-32 rounded-full border border-dashed border-white/10 absolute opacity-30" />
      <span className="text-7xl mb-4 relative z-10">{vibe.emoji}</span>
      <p className="text-2xl font-black uppercase tracking-tight text-gradient mb-1 relative z-10"
         style={{ fontFamily: 'Anton, sans-serif' }}>{vibe.label}</p>
      <p className="text-white/40 text-sm mb-2 relative z-10">{vibe.price} · Location hidden</p>
      <p className="text-white/25 text-xs max-w-[200px] leading-relaxed mb-6 relative z-10">
        The host is keeping the destination a secret until it's time 🤫
      </p>

      {/* RSVP buttons */}
      <div className="flex gap-3 relative z-10">
        <button
          onClick={() => onRsvp('in')}
          className={`flex-1 h-12 rounded-2xl font-bold text-sm transition-all ${
            rsvp === 'in'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/8 border border-white/15 text-white/60 hover:bg-white/12'
          }`}
        >
          I'm in ✅
        </button>
        <button
          onClick={() => onRsvp('out')}
          className={`flex-1 h-12 rounded-2xl font-bold text-sm transition-all ${
            rsvp === 'out'
              ? 'bg-red-500/80 text-white'
              : 'bg-white/8 border border-white/15 text-white/60 hover:bg-white/12'
          }`}
        >
          Can't make it 😔
        </button>
      </div>

      {isHost && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onConfirm}
          disabled={confirmLoading}
          className="mt-4 w-full h-12 bg-gradient-to-r from-cyan-500 to-fuchsia-600 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 relative z-10 disabled:opacity-50"
        >
          {confirmLoading
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            : <><Lock size={14} /> Confirm this plan</>}
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Confirmed Banner ──────────────────────────────────────────────────────── */
function ConfirmedBanner({ session, isHost, onReveal, revealLoading }: {
  session: SessionData; isHost: boolean; onReveal: () => void; revealLoading: boolean;
}) {
  const isMystery = session.mysteryMode;
  const revealed = session.status === 'revealed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="h-2 bg-gradient-to-r from-cyan-500 to-fuchsia-600" />
      <div className="p-6 text-center">
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
        <p className="label-xs text-emerald-400 mb-2">Plan confirmed</p>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2"
            style={{ fontFamily: 'Anton, sans-serif' }}>
          {session.title}
        </h3>

        {session.date && (
          <p className="text-white/50 text-sm mb-4">
            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            {session.time && ` at ${session.time}`}
          </p>
        )}

        {/* Normal mode: show confirmed option */}
        {!isMystery && session.confirmedOptionText && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-fuchsia-600/10 border border-cyan-500/20 rounded-2xl p-4 mb-4">
            <p className="font-bold text-lg">{session.confirmedOptionText}</p>
          </div>
        )}

        {/* Mystery mode: show vibe or revealed destination */}
        {isMystery && !revealed && session.mysteryVibe && (
          <div className="mb-4">
            <div className="text-5xl mb-2">{session.mysteryVibe.emoji}</div>
            <p className="font-bold text-lg">{session.mysteryVibe.label}</p>
            <p className="text-white/40 text-sm mt-1">Destination still hidden 🤫</p>
          </div>
        )}

        {isMystery && revealed && session.mysteryDestination && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-cyan-500/20 to-fuchsia-600/20 border border-cyan-500/30 rounded-2xl p-5 mb-4"
          >
            <p className="text-white/50 text-xs mb-1">The destination is…</p>
            <p className="font-black text-2xl text-gradient">{session.mysteryDestination}</p>
          </motion.div>
        )}

        {/* Reveal button for host in mystery mode */}
        {isMystery && !revealed && isHost && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onReveal}
            disabled={revealLoading}
            className="btn-primary w-full mt-2"
          >
            {revealLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <><Eye size={18} /> Reveal the destination!</>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Chat Bubble ───────────────────────────────────────────────────────────── */
function ChatBubble({ msg, isOwn }: { key?: React.Key; msg: ChatMessage; isOwn: boolean }) {
  const av = getAvatarByEmoji(msg.avatarEmoji);
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`avatar-bubble-sm bg-gradient-to-br ${av.bg} shrink-0`}>
        {msg.avatarEmoji}
      </div>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && (
          <span className="text-[10px] text-white/30 px-1">{msg.userName}</span>
        )}
        <div className={isOwn ? 'msg-bubble-mine' : 'msg-bubble-theirs'}>
          <p className="leading-snug">{msg.text}</p>
        </div>
      </div>
    </div>
  );
}
