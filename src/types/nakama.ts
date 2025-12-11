// Type definitions for Nakama service
import type { GameState } from "./game";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  userId: string;
}

export interface NakamaService {
  // Authentication
  authenticate(deviceId: string, username: string): Promise<void>;

  // Socket connection
  connectSocket(): Promise<void>;
  disconnect(): void;

  // Matchmaking
  findMatch(): Promise<boolean>;
  joinMatch(matchId: string): Promise<boolean>;

  // Gameplay
  sendMove(position: number): Promise<void>;

  // Leaderboard
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // User info
  getUserId(): string | null;
  getUsername(): string | null;

  // Callbacks
  onAuthenticated?: () => void;
  onConnected?: () => void;
  onMatchJoined?: () => void;
  onMatchStateUpdate?: (state: GameState) => void;
  onError?: (message: string) => void;
}
