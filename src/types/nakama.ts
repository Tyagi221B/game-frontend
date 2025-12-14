// Type definitions for Nakama service
import type { GameState } from "./game";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  winRate: number;
  userId: string;
  winStreak: number;
  bestWinStreak: number;
}

export interface NakamaService {
  // Authentication
  authenticate(nickname: string): Promise<boolean>;
  logout(): void;
  isAuthenticated(): boolean;
  hasStoredIdentity(): boolean;
  getStoredUsername(): string | null;

  // Socket connection
  connectSocket(): Promise<boolean>;
  disconnect(): void;

  // Matchmaking
  findMatch(mode?: string): Promise<boolean>;
  cancelMatch(): Promise<void>;
  joinMatch(matchId: string): Promise<boolean>;

  // Gameplay
  sendMove(position: number): Promise<void>;
  leaveMatch(): Promise<void>;

  // Leaderboard
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // User info
  getUserId(): string | null;
  getUsername(): string | null;
  getConnectionStatus(): ConnectionStatus;

  // Callbacks
  onAuthenticated?: () => void;
  onConnected?: () => void;
  onMatchJoined?: () => void;
  onMatchStateUpdate?: (state: GameState) => void;
  onError?: (message: string) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}
