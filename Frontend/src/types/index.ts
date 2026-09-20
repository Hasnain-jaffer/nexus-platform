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
  location: string; // shared field on every user in the backend model, not entrepreneur-only
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
  foundedYear: number;
  teamSize: number;
}