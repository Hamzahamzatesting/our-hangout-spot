export interface Avatar {
  emoji: string;
  name: string;
  bg: string;
}

export const AVATARS: Avatar[] = [
  { emoji: '🐼', name: 'Chill Panda',   bg: 'from-emerald-400 to-teal-600'   },
  { emoji: '🐺', name: 'Alpha Wolf',    bg: 'from-slate-400 to-gray-700'     },
  { emoji: '🐸', name: 'Chill Frog',    bg: 'from-green-400 to-lime-600'     },
  { emoji: '🐵', name: 'Chaos Monkey',  bg: 'from-orange-400 to-red-500'     },
  { emoji: '🦊', name: 'Smooth Fox',    bg: 'from-orange-500 to-amber-600'   },
  { emoji: '🦁', name: 'The Boss',      bg: 'from-yellow-400 to-orange-500'  },
  { emoji: '🐨', name: 'Zen Koala',     bg: 'from-blue-300 to-indigo-500'    },
  { emoji: '🦋', name: 'Free Spirit',   bg: 'from-purple-400 to-fuchsia-500' },
  { emoji: '🐯', name: 'Wild Tiger',    bg: 'from-yellow-400 to-orange-600'  },
  { emoji: '🦅', name: 'Bold Eagle',    bg: 'from-sky-400 to-blue-700'       },
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
