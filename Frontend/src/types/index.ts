export type UserRole = 'entrepreneur' | 'investor';

// ── Core user shared by both roles ─────────────────────────────────────────
export interface User {
  id: string;       // maps from MongoDB _id via API normalisation
  _id?: string;     // raw MongoDB field (normalised away in services)
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
  token?: string;   // present only immediately after login/register
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

// ── Messaging ──────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;   // normalised from createdAt
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  partner: User;       // populated user object from API
  lastMessage?: Message;
  updatedAt: string;
}

// ── Collaboration ──────────────────────────────────────────────────────────
export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  investor?: User;        // populated by API
  entrepreneur?: User;    // populated by API
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// ── Documents ──────────────────────────────────────────────────────────────
export interface Document {
  id: string;
  name: string;
  filename: string;
  mimetype: string;
  size: number;         // bytes (format in UI layer)
  ownerId: string;
  sharedWith: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Deals ──────────────────────────────────────────────────────────────────
export type DealStatus = 'Negotiation' | 'Term Sheet' | 'Due Diligence' | 'Closed' | 'Cancelled';
export type DealStage  = 'Pre-seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C';

export interface Deal {
  id: string;
  investorId: string;
  entrepreneurId: string;
  investor?: User;
  entrepreneur?: User;
  amount: string;
  equity: string;
  stage: DealStage;
  status: DealStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Notifications ──────────────────────────────────────────────────────────
export type NotificationType = 'message' | 'connection' | 'investment' | 'deal' | 'document' | 'system';

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  sender?: User;
  type: NotificationType;
  content: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

// ── Auth context ───────────────────────────────────────────────────────────
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
