export interface UserProfile {
  uid: string;
  displayName: string;
  avatar: string;
  avatarName: string;
  avatarBg: string;
  crewRole?: string;
  crewRoleEmoji?: string;
  crewRoleLine?: string;
  totalPlans?: number;
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
}
