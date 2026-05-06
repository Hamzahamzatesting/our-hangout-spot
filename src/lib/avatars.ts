export interface Avatar {
  emoji: string;
  name: string;
  bg: string;
}

export interface CrewRole {
  emoji: string;
  label: string;
  line: string;
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
  { emoji: '😆', name: 'Laugh Track',  bg: 'from-lime-300 to-emerald-600'   },
  { emoji: '😋', name: 'Food Scout',   bg: 'from-orange-300 to-rose-500'    },
  { emoji: '😴', name: 'Sleepy Legend', bg: 'from-blue-300 to-slate-600'    },
  { emoji: '🤑', name: 'Deal Finder',  bg: 'from-green-300 to-teal-700'     },
  { emoji: '🤭', name: 'Secret Keeper', bg: 'from-fuchsia-300 to-pink-600'  },
  { emoji: '😤', name: 'Locked In',    bg: 'from-red-400 to-orange-600'     },
  { emoji: '🥹', name: 'Sweet Soul',   bg: 'from-pink-300 to-cyan-500'      },
  { emoji: '😵‍💫', name: 'Chaos Mode', bg: 'from-violet-400 to-red-500'     },
  { emoji: '🙃', name: 'Plot Twist',   bg: 'from-yellow-300 to-fuchsia-500' },
  { emoji: '🫠', name: 'Melted',       bg: 'from-cyan-300 to-indigo-500'    },
  { emoji: '🤌', name: 'Taste Maker',  bg: 'from-rose-300 to-amber-500'     },
  { emoji: '🫶', name: 'Heart Of It',  bg: 'from-pink-400 to-purple-600'    },
  { emoji: '🤯', name: 'Big Idea',     bg: 'from-amber-300 to-pink-600'     },
  { emoji: '🥸', name: 'Incognito',    bg: 'from-gray-300 to-zinc-700'      },
];

export const CREW_ROLES: CrewRole[] = [
  { emoji: '🧭', label: 'Navigator', line: 'finds the spot' },
  { emoji: '🎧', label: 'DJ', line: 'sets the mood' },
  { emoji: '🍟', label: 'Snack Boss', line: 'orders for the table' },
  { emoji: '📸', label: 'Memory Maker', line: 'gets the evidence' },
  { emoji: '⚡', label: 'Hype Captain', line: 'keeps everyone moving' },
  { emoji: '🛋️', label: 'Chill Manager', line: 'protects the vibe' },
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
