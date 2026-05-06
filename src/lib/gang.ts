export interface GangMember {
  name: string;
  emoji: string;
  bg: string;
  color: string;
  shadow: string;
}

export const GANG: GangMember[] = [
  {
    name: 'Saad',
    emoji: '🦁',
    bg: 'from-orange-400 to-amber-600',
    color: '#f97316',
    shadow: 'rgba(249,115,22,0.5)',
  },
  {
    name: 'Lamiae',
    emoji: '🌙',
    bg: 'from-purple-400 to-violet-600',
    color: '#a855f7',
    shadow: 'rgba(168,85,247,0.5)',
  },
  {
    name: 'Hamza',
    emoji: '⚡',
    bg: 'from-cyan-400 to-blue-500',
    color: '#22d3ee',
    shadow: 'rgba(34,211,238,0.5)',
  },
  {
    name: 'Youssef',
    emoji: '🔥',
    bg: 'from-red-400 to-orange-500',
    color: '#ef4444',
    shadow: 'rgba(239,68,68,0.5)',
  },
  {
    name: 'Imane',
    emoji: '🌸',
    bg: 'from-pink-400 to-fuchsia-500',
    color: '#ec4899',
    shadow: 'rgba(236,72,153,0.5)',
  },
];

export const getMember = (name: string) =>
  GANG.find(m => m.name === name) ?? GANG[0];

// Dynamic roles based on Firestore stats
export function computeRole(stats: {
  dropCount: number;
  planCount: number;
  reactCount: number;
  missedCount: number;
}): { title: string; emoji: string } {
  const { dropCount, planCount, reactCount, missedCount } = stats;
  if (planCount >= 3) return { title: 'The Architect', emoji: '🏗️' };
  if (dropCount >= 10) return { title: 'The Spark', emoji: '⚡' };
  if (reactCount >= 15) return { title: 'The Hype', emoji: '🔥' };
  if (missedCount >= 3) return { title: 'The Ghost', emoji: '👻' };
  return { title: 'The Crew', emoji: '🫂' };
}
