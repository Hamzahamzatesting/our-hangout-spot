export const ORACLE_QUESTIONS: string[] = [
  'Who is most likely to bail last minute? 👻',
  'Rate last night out of 10 🌙',
  'Who has the worst music taste in the gang? 🎵',
  'Who would survive a week in the wild? 🏕️',
  'Who is secretly the funniest? 😂',
  'Next trip destination — drop your vote 🌍',
  'Who takes the longest to get ready? 💅',
  'Who would win in an argument with a stranger? 😤',
  'Who is most likely to become famous? ⭐',
  'Rate the gang vibe this week 🔥',
  'Who eats the most? 🍕',
  'Who gives the best advice? 🧠',
  'Who is the most dramatic? 🎭',
  'Who would you call at 3am? 📞',
  'Who sleeps the most? 😴',
  'Who is the gang photographer? 📸',
  'Who has changed the most this year? 💫',
  'Who is the peacemaker when things get tense? ☮️',
  'Who would blow the group budget on food? 💸',
  'Who is always late but never sorry? ⏰',
  'Honest rating of the last hangout 🎯',
  'Who is the most competitive? 🏆',
  'Who knows everyone\'s secrets? 🤫',
  'Who would survive without their phone for a week? 📵',
  'Who brings the best energy to every hangout? ✨',
  'Morocco trip — who is actually ready? 🇲🇦',
  'Who owes who money right now? 💀',
  'Best memory with the gang this year? 🎞️',
  'Who is going to be the last one to get their life together? 😅',
  'What\'s the gang\'s power move this weekend? 💪',
];

export function getTodayQuestion(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return ORACLE_QUESTIONS[dayOfYear % ORACLE_QUESTIONS.length];
}

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
