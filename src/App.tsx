import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile } from './types';

import Landing from './components/Landing';
import AvatarPicker from './components/AvatarPicker';
import Dashboard from './components/Dashboard';
import CreatePlan from './components/CreatePlan';
import SessionRoom from './components/SessionRoom';
import Reveal from './components/Reveal';

type Screen = 'landing' | 'pickAvatar' | 'dashboard' | 'create' | 'session';

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [revealResult, setRevealResult] = useState<unknown>(null);

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
        },
      });
    } catch {
      // Already a member — that's fine
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
            setScreen('dashboard');
          }
        } else {
          setScreen('pickAvatar');
        }
      } catch {
        setScreen('pickAvatar');
      } finally {
        setLoading(false);
      }
    });
  }, [loadProfile, pendingJoinId, joinSession]);

  const handleAvatarSaved = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    if (pendingJoinId) {
      await joinSession(pendingJoinId, profile);
    } else {
      setScreen('dashboard');
    }
  }, [pendingJoinId, joinSession]);

  const handleSelectSession = useCallback((id: string, status?: string, result?: unknown) => {
    setCurrentSessionId(id);
    setSessionStatus(status ?? null);
    setRevealResult(result ?? null);
    setScreen('session');
  }, []);

  const handlePlanCreated = useCallback((id: string) => {
    setCurrentSessionId(id);
    setSessionStatus('collecting');
    setScreen('session');
  }, []);

  const handleBackFromSession = useCallback(() => {
    setCurrentSessionId(null);
    setSessionStatus(null);
    setRevealResult(null);
    setScreen('dashboard');
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

  return (
    <div className="min-h-screen w-full bg-[#050505] relative">
      <div className="atmosphere" />
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div key="landing" className="min-h-screen" {...slide}>
            <Landing />
          </motion.div>
        )}
        {screen === 'pickAvatar' && user && (
          <motion.div key="avatar" className="min-h-screen" {...slide}>
            <AvatarPicker user={user} onSaved={handleAvatarSaved} />
          </motion.div>
        )}
        {screen === 'dashboard' && userProfile && (
          <motion.div key="dashboard" className="min-h-screen" {...slide}>
            <Dashboard
              profile={userProfile}
              onSelectSession={handleSelectSession}
              onCreatePlan={() => setScreen('create')}
            />
          </motion.div>
        )}
        {screen === 'create' && userProfile && (
          <motion.div key="create" className="min-h-screen" {...slide}>
            <CreatePlan
              profile={userProfile}
              onCreated={handlePlanCreated}
              onBack={() => setScreen('dashboard')}
            />
          </motion.div>
        )}
        {screen === 'session' && currentSessionId && userProfile && (
          <motion.div key="session" className="min-h-screen" {...slide}>
            {sessionStatus === 'revealed' && revealResult ? (
              <Reveal result={revealResult} onBack={handleBackFromSession} />
            ) : (
              <SessionRoom
                sessionId={currentSessionId}
                profile={userProfile}
                onBack={handleBackFromSession}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
