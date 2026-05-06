export interface UserProfile {
  uid: string;
  gangName: string;
  displayName: string;
  avatar: string;
  avatarName: string;
  avatarBg: string;
  crewRole?: string;
  crewRoleEmoji?: string;
  crewRoleLine?: string;
  totalPlans?: number;
  dropCount?: number;
  planCount?: number;
  reactCount?: number;
  missedCount?: number;
  lastActive?: any;
}

export interface MemberProfile {
  name: string;
  avatar: string;
  avatarBg: string;
  crewRole?: string;
  crewRoleEmoji?: string;
}

export interface PlanOption {
  id: string;
  text: string;
  createdBy: string;
  voters: string[];
  addedAt: any;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatarEmoji: string;
  text: string;
  createdAt: any;
}

export interface MysteryVibe {
  emoji: string;
  label: string;
  price: string;
}

export interface SessionData {
  id: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  status: 'collecting' | 'confirmed' | 'revealed';
  hostId: string;
  members: string[];
  memberProfiles: Record<string, MemberProfile>;
  mysteryMode: boolean;
  mysteryVibe?: MysteryVibe;
  mysteryDestination?: string;
  confirmedOptionId?: string;
  confirmedOptionText?: string;
  createdAt: any;
  result?: any;
  hype?: HypeEntry[];
}

export type DropType = 'text' | 'vibe' | 'location';

export interface Drop {
  id?: string;
  type: DropType;
  content: string;
  authorName: string;
  authorEmoji: string;
  authorBg: string;
  createdAt: any;
  expiresAt: any;
  pinned: boolean;
  reactions: Record<string, string>;
}

export interface OracleDay {
  question: string;
  answers: Record<string, string>;
  revealed: boolean;
  date: string;
}

export interface HypeEntry {
  name: string;
  text: string;
}

export interface WallMoment {
  id?: string;
  title: string;
  emoji: string;
  date: string;
  note?: string;
  planId?: string;
  createdAt?: any;
}
