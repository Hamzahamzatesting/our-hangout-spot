import { motion } from 'motion/react';

export type Tab = 'hq' | 'drops' | 'oracle' | 'plans' | 'wall';

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'hq',     emoji: '🏠', label: 'HQ' },
  { id: 'drops',  emoji: '💧', label: 'Drops' },
  { id: 'oracle', emoji: '🔮', label: 'Oracle' },
  { id: 'plans',  emoji: '📋', label: 'Plans' },
  { id: 'wall',   emoji: '🗺️', label: 'Wall' },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <div className="flex items-center justify-around px-2 py-2 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl"
         style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-1 flex-1 py-1 relative"
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-2xl bg-white/5"
              />
            )}
            <span className={`text-xl transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-40'}`}>
              {tab.emoji}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${isActive ? 'text-white' : 'text-white/30'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
