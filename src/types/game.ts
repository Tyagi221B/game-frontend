// types/game.ts - Type definitions matching server's GameState

// Matches server's GameState interface EXACTLY
export interface GameState {
  board: (string | null)[];
  currentTurn: string | null;
  players: {
    [userId: string]: {
      username: string;
      symbol: "X" | "O";
      connected: boolean;
    };
  };
  status: "waiting" | "active" | "completed";
  winner: string | null;
  createdAt: number;
}

// OpCodes for client-server communication (matches server)
export const OpCode = {
  STATE_UPDATE: 1,
  MAKE_MOVE: 2,
} as const;

// Frontend-specific helper types
export interface Player {
  userId: string;
  username: string;
  symbol: "X" | "O";
  connected: boolean;
}

// Match information
export interface MatchInfo {
  matchId: string;
  label: string;
}
