import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc, getDoc, updateDoc, arrayUnion, serverTimestamp,
  collection, onSnapshot, query, orderBy, where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile, SessionData } from './types';

import Landing from './components/Landing';
import IdentityPicker from './components/IdentityPicker';
import HQScreen from './components/HQScreen';
import DropsTab from './components/DropsTab';
import OracleTab from './components/OracleTab';
import WallTab from './components/WallTab';
import TabBar, { Tab } from './components/TabBar';
import CreatePlan from './components/CreatePlan';
import SessionRoom from './components/SessionRoom';
import Reveal from './components/Reveal';

type Screen = 'landing' | 'identity' | 'hq' | 'session';

const slide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
  transition: { duration: 0.25, ease: 'easeInOut' as const },
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('hq');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [revealResult, setRevealResult] = useState<unknown>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  const [pendingJoinId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('join')
  );

  const joinSession = useCallback(async (sessionId: string, profile: UserProfile) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        members: arrayUnion(auth.currentUser.uid),
        [`memberProfiles.${auth.currentUser.uid}`]: {
          name: profile.displayName,
          avatar: profile.avatar,
          avatarBg: profile.avatarBg,
          crewRole: profile.crewRole,
          crewRoleEmoji: profile.crewRoleEmoji,
        },
      });
    } catch {
      // Already a member
    }
    window.history.replaceState({}, '', '/');
    setCurrentSessionId(sessionId);
    setScreen('session');
  }, []);

  const loadProfile = useCallback(async (u: User): Promise<UserProfile | null> => {
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (!snap.exists()) return null;
    return { uid: u.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setScreen('landing');
        setUserProfile(null);
        return;
      }
      try {
        const profile = await loadProfile(u);
        if (profile) {
          setUserProfile(profile);
          updateDoc(doc(db, 'users', u.uid), { lastActive: serverTimestamp() }).catch(() => {});
          if (pendingJoinId) {
            await joinSession(pendingJoinId, profile);
          } else {
            setScreen('hq');
          }
        } else {
          setScreen('identity');
        }
      } catch {
        setScreen('identity');
      } finally {
        setLoading(false);
      }
    });
  }, [loadProfile, pendingJoinId, joinSession]);

  const handleIdentityPicked = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    if (pendingJoinId) {
      await joinSession(pendingJoinId, profile);
    } else {
      setScreen('hq');
    }
  }, [pendingJoinId, joinSession]);

  const handlePlanCreated = useCallback((id: string) => {
    setCurrentSessionId(id);
    setSessionStatus('collecting');
    setShowCreatePlan(false);
    setScreen('session');
  }, []);

  const handleOpenPlan = useCallback((id: string, status?: string, result?: unknown) => {
    setCurrentSessionId(id);
    setSessionStatus(status ?? null);
    setRevealResult(result ?? null);
    setScreen('session');
  }, []);

  const handleBackFromSession = useCallback(() => {
    setCurrentSessionId(null);
    setSessionStatus(null);
    setRevealResult(null);
    setScreen('hq');
    setActiveTab('plans');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-600 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
        />
      </div>
    );
  }

  if (screen === 'session' && currentSessionId && userProfile) {
    return (
      <div className="min-h-screen w-full bg-[#050505] relative">
        <div className="atmosphere" />
        {sessionStatus === 'revealed' && revealResult ? (
          <Reveal result={revealResult} onBack={handleBackFromSession} />
        ) : (
          <SessionRoom
            sessionId={currentSessionId}
            profile={userProfile}
            onBack={handleBackFromSession}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] relative flex flex-col">
      <div className="atmosphere" />

      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div key="landing" className="flex-1" {...slide}>
            <Landing />
          </motion.div>
        )}

        {screen === 'identity' && user && (
          <motion.div key="identity" className="flex-1" {...slide}>
            <IdentityPicker user={user} onPicked={handleIdentityPicked} />
          </motion.div>
        )}

        {screen === 'hq' && userProfile && (
          <motion.div key="hq" className="flex-1 flex flex-col overflow-hidden" {...slide}>
            <AnimatePresence>
              {showCreatePlan && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute inset-0 z-50 bg-[#050505]"
                >
                  <div className="atmosphere" />
                  <CreatePlan
                    profile={userProfile}
                    onCreated={handlePlanCreated}
                    onBack={() => setShowCreatePlan(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-hidden relative z-10">
              <AnimatePresence mode="wait">
                {activeTab === 'hq' && (
                  <motion.div key="tab-hq" className="h-full" {...slide}>
                    <HQScreen profile={userProfile} />
                  </motion.div>
                )}
                {activeTab === 'drops' && (
                  <motion.div key="tab-drops" className="h-full" {...slide}>
                    <DropsTab profile={userProfile} />
                  </motion.div>
                )}
                {activeTab === 'oracle' && (
                  <motion.div key="tab-oracle" className="h-full" {...slide}>
                    <OracleTab profile={userProfile} />
                  </motion.div>
                )}
                {activeTab === 'plans' && (
                  <motion.div key="tab-plans" className="h-full overflow-y-auto px-5 pt-6 pb-4" {...slide}>
                    <PlansTab
                      profile={userProfile}
                      onOpenPlan={handleOpenPlan}
                      onCreatePlan={() => setShowCreatePlan(true)}
                    />
                  </motion.div>
                )}
                {activeTab === 'wall' && (
                  <motion.div key="tab-wall" className="h-full" {...slide}>
                    <WallTab profile={userProfile} onOpenPlan={handleOpenPlan} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative z-10">
              <TabBar active={activeTab} onChange={setActiveTab} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Plans Tab ────────────────────────────────────────────────────────────────

function PlansTab({
  onOpenPlan,
  onCreatePlan,
}: {
  profile: UserProfile;
  onOpenPlan: (id: string, status: string, result?: unknown) => void;
  onCreatePlan: () => void;
}) {
  const [active, setActive] = useState<SessionData[]>([]);
  const [past, setPast] = useState<SessionData[]>([]);

  useEffect(() => {
    const qa = query(collection(db, 'sessions'), where('status', '==', 'collecting'), orderBy('createdAt', 'desc'));
    const ua = onSnapshot(qa, snap => {
      setActive(snap.docs.map(d => ({ id: d.id, ...d.data() }) as unknown as SessionData));
    });
    const qp = query(collection(db, 'sessions'), where('status', 'in', ['confirmed', 'revealed']), orderBy('createdAt', 'desc'));
    const up = onSnapshot(qp, snap => {
      setPast(snap.docs.map(d => ({ id: d.id, ...d.data() }) as unknown as SessionData));
    });
    return () => { ua(); up(); };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: 'Anton, sans-serif' }}>
          <span className="text-gradient">Plans</span>
        </h2>
        <button onClick={onCreatePlan} className="btn-primary px-5 h-10 text-sm font-bold">
          + New
        </button>
      </div>

      {active.length > 0 && (
        <div>
          <p className="label-xs mb-3">Active 🔥</p>
          <div className="flex flex-col gap-2">
            {active.map(plan => (
              <PlanRow key={plan.id} plan={plan} onOpen={onOpenPlan} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="label-xs mb-3">Happened</p>
          <div className="flex flex-col gap-2">
            {past.map(plan => (
              <PlanRow key={plan.id} plan={plan} onOpen={onOpenPlan} />
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && past.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-5xl">📋</span>
          <p className="text-white/40 text-sm">No plans yet.</p>
          <button onClick={onCreatePlan} className="btn-primary px-8 h-12 text-sm font-bold mt-2">
            Start a Plan
          </button>
        </div>
      )}
    </div>
  );
}

const PlanRow: React.FC<{
  plan: SessionData;
  onOpen: (id: string, status: string, result?: unknown) => void;
}> = function PlanRow({ plan, onOpen }) {
  const isActive = plan.status === 'collecting';
  return (
    <button
      onClick={() => onOpen(plan.id, plan.status, plan.result)}
      className="glass-card-sm px-4 py-3 flex items-center justify-between text-left active:scale-[0.98] transition-transform"
    >
      <div>
        <p className="text-sm font-bold">{plan.title}</p>
        <p className="text-white/30 text-xs mt-0.5">{plan.members.length} crew</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full border ${
        isActive
          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
          : 'bg-white/5 text-white/30 border-white/10'
      }`}>
        {isActive ? 'Voting' : 'Done'}
      </span>
    </button>
  );
}
