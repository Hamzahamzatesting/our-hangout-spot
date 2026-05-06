import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, LogOut, ArrowRight, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Dashboard({ onSelectSession }: { onSelectSession: (id: string) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Update user profile
    setDoc(doc(db, 'users', auth.currentUser.uid), {
      displayName: auth.currentUser.displayName,
      photoURL: auth.currentUser.photoURL,
      lastActive: serverTimestamp()
    }, { merge: true });

    const q = query(
      collection(db, 'sessions'), 
      where('members', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sessions'));

    return () => unsubscribe();
  }, []);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !auth.currentUser) return;

    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        title: newTitle,
        status: 'collecting',
        hostId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        members: [auth.currentUser.uid]
      });
      setNewTitle('');
      setShowCreate(false);
      onSelectSession(docRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sessions');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <header className="flex justify-between items-end mb-16">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[.3em]">Active Rituals</span>
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter italic">Pacts</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
             <div className="text-sm font-bold">{auth.currentUser?.displayName}</div>
             <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Status: Connected</div>
          </div>
          <button onClick={() => auth.signOut()} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:text-fuchsia-400 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {sessions.map((session) => (
            <motion.div
              layout
              key={session.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => onSelectSession(session.id)}
              className="glass-card group p-8 cursor-pointer flex items-center justify-between hover:bg-white/[0.05] transition-all border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{session.title}</h3>
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${session.status === 'collecting' ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-white/40'}`}>
                    {session.status}
                  </div>
                  <span className="text-[10px] text-white/20 uppercase font-mono">{new Date(session.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                <ArrowRight size={24} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sessions.length === 0 && (
          <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[32px]">
            <Ghost className="mx-auto mb-4 text-white/10" size={64} />
            <p className="text-white/20 font-medium italic">Your vault is empty. Summon your first ritual.</p>
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCreate(true)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-white text-black rounded-[24px] shadow-[0_20px_50px_rgba(255,255,255,0.2)] flex items-center justify-center z-40"
      >
        <Plus size={36} strokeWidth={3} />
      </motion.button>

      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-10 w-full max-w-md relative"
          >
            <h2 className="text-2xl font-bold mb-6">Name the Ritual</h2>
            <form onSubmit={createSession}>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 mb-6 focus:outline-none focus:border-accent transition-colors"
                placeholder="Friday Night Out..."
              />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-white text-black py-4 rounded-xl font-bold">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-4 rounded-xl border border-white/10">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
