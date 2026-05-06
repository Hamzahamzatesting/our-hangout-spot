import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GANG, getMember } from '../lib/gang';
import { getTodayQuestion, getTodayKey } from '../lib/oracle-questions';
import { UserProfile, OracleDay } from '../types';

interface Props {
  profile: UserProfile;
}

export default function OracleTab({ profile }: Props) {
  const [oracle, setOracle] = useState<OracleDay | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const todayKey = getTodayKey();
  const todayQuestion = getTodayQuestion();
  const oracleRef = doc(db, 'oracle', todayKey);

  // Bootstrap today's oracle doc if missing
  useEffect(() => {
    const init = async () => {
      const snap = await import('firebase/firestore').then(m =>
        m.getDoc(oracleRef)
      );
      if (!snap.exists()) {
        await setDoc(oracleRef, {
          question: todayQuestion,
          answers: {},
          revealed: false,
          date: todayKey,
        });
      }
    };
    init().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  useEffect(() => {
    const unsub = onSnapshot(oracleRef, snap => {
      if (snap.exists()) {
        setOracle(snap.data() as OracleDay);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  const hasAnswered = oracle?.answers?.[profile.gangName] !== undefined;
  const answeredCount = oracle ? Object.keys(oracle.answers).length : 0;
  const allAnswered = answeredCount === GANG.length;

  const submitAnswer = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    await updateDoc(oracleRef, {
      [`answers.${profile.gangName}`]: answer.trim(),
    });
    setAnswer('');
    setSubmitting(false);
  };

  const revealAnswers = async () => {
    setRevealing(true);
    await updateDoc(oracleRef, { revealed: true });
    setRevealing(false);
  };

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-4 overflow-y-auto gap-5">

      {/* Header */}
      <div>
        <p className="label-xs mb-1">Daily</p>
        <h2
          className="text-2xl font-black uppercase tracking-tight text-gradient"
          style={{ fontFamily: 'Anton, sans-serif' }}
        >
          The Oracle
        </h2>
      </div>

      {/* Question card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center relative overflow-hidden"
      >
        {/* ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5 pointer-events-none" />
        <span className="text-4xl mb-4 block">🔮</span>
        <p className="text-white/90 text-lg font-semibold leading-snug">
          {oracle?.question ?? todayQuestion}
        </p>
        <p className="text-white/25 text-xs mt-3">{todayKey}</p>
      </motion.div>

      {/* Progress */}
      <div className="glass-card-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label-xs">Who answered</p>
          <span className="text-xs text-white/40">{answeredCount}/{GANG.length}</span>
        </div>
        <div className="flex gap-2">
          {GANG.map(m => {
            const answered = oracle?.answers?.[m.name] !== undefined;
            return (
              <div key={m.name} className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.bg} flex items-center justify-center text-lg transition-all duration-300 ${answered ? 'opacity-100' : 'opacity-25 grayscale'}`}
                >
                  {m.emoji}
                </div>
                <span className="text-[9px] text-white/40">{m.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Answer input or results */}
      <AnimatePresence mode="wait">
        {oracle?.revealed ? (
          /* Results */
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <p className="label-xs">🎯 The Answers</p>
            {GANG.map(m => {
              const ans = oracle.answers?.[m.name];
              const member = getMember(m.name);
              return (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card-sm p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${member.bg} flex items-center justify-center text-lg shrink-0`}
                  >
                    {member.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 font-medium">{m.name}</p>
                    <p className="text-sm text-white/80 mt-0.5">
                      {ans ?? <span className="text-white/20 italic">stayed quiet</span>}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : !hasAnswered ? (
          /* Submit answer */
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 flex flex-col gap-4"
          >
            <p className="text-white/60 text-sm text-center">Drop your answer — it stays hidden until revealed 🤫</p>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Your answer…"
              rows={3}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none resize-none"
            />
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || submitting}
              className="btn-primary w-full font-bold uppercase tracking-widest"
            >
              {submitting ? 'Sending…' : 'Drop it 🔮'}
            </button>
          </motion.div>
        ) : (
          /* Waiting for others */
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6 text-center flex flex-col items-center gap-4"
          >
            <span className="text-4xl">⏳</span>
            <p className="text-white/60 text-sm">
              You answered. Waiting for the others…
            </p>
            {allAnswered && (
              <button
                onClick={revealAnswers}
                disabled={revealing}
                className="btn-primary w-full font-bold uppercase tracking-widest"
              >
                {revealing ? 'Revealing…' : '🎯 Reveal All Answers'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
