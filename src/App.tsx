import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import SessionRoom from './components/SessionRoom';
import Reveal from './components/Reveal';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentSessionId) {
      setSessionData(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'sessions', currentSessionId), (s) => {
      if (s.exists()) {
        setSessionData(s.data());
      }
    });
    
    return () => unsub();
  }, [currentSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-accent w-4 h-4 rounded-full shadow-[0_0_20px_#ff4e00]" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Landing />
          </motion.div>
        ) : !currentSessionId ? (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard onSelectSession={(id) => setCurrentSessionId(id)} />
          </motion.div>
        ) : sessionData?.status === 'revealed' ? (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Reveal result={sessionData.result} onBack={() => setCurrentSessionId(null)} />
          </motion.div>
        ) : (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SessionRoom sessionId={currentSessionId} onBack={() => setCurrentSessionId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
