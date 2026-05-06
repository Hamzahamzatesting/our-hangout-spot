export interface Avatar {
  emoji: string;
  name: string;
  bg: string;
}

export const AVATARS: Avatar[] = [
  { emoji: '🙂', name: 'Easygoing',    bg: 'from-emerald-400 to-teal-600'   },
  { emoji: '😎', name: 'Cool Energy',  bg: 'from-sky-400 to-blue-700'       },
  { emoji: '🤓', name: 'Planner',      bg: 'from-indigo-400 to-violet-600'   },
  { emoji: '😂', name: 'Comic Relief', bg: 'from-yellow-300 to-orange-500'  },
  { emoji: '🥳', name: 'Party Starter', bg: 'from-pink-400 to-fuchsia-600'  },
  { emoji: '🤠', name: 'Wildcard',     bg: 'from-amber-400 to-red-500'      },
  { emoji: '😇', name: 'Good Vibes',   bg: 'from-cyan-300 to-blue-500'      },
  { emoji: '🤩', name: 'Hype Mode',    bg: 'from-purple-400 to-fuchsia-500' },
  { emoji: '😌', name: 'Calm One',     bg: 'from-green-300 to-lime-600'     },
  { emoji: '🫡', name: 'Reliable',     bg: 'from-slate-300 to-gray-600'     },
];

export const MYSTERY_VIBES = [
  { emoji: '🍔', label: 'Casual Vibes',  price: '$'   },
  { emoji: '🌃', label: 'Night Out',     price: '$$'  },
  { emoji: '💸', label: 'Splurge Mode',  price: '$$$' },
  { emoji: '🌮', label: 'Street Food',   price: '$'   },
  { emoji: '🍣', label: 'Fancy AF',      price: '$$$' },
  { emoji: '🎮', label: 'Adventure',     price: '$$'  },
  { emoji: '🌿', label: 'Chill Zone',    price: '$'   },
  { emoji: '🎉', label: 'Party Mode',    price: '$$'  },
];

export const SOCIAL_COMMENTS = [
  'always shows up ✅',
  'picks the best spots 👑',
  'probably forgot already 💀',
  'is the hype machine 🔥',
  'shows up 10 min late ⏰',
  'never cancels 🏆',
];

export function getAvatarByEmoji(emoji: string): Avatar {
  return AVATARS.find(a => a.emoji === emoji) ?? AVATARS[0];
}
