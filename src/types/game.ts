// types/game.ts - Type definitions matching server's GameState

// Game mode types
export type GameMode = "classic" | "timed";

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
  mode: GameMode;
  createdAt: number;
  turnStartTimestamp: number | null;
}

// OpCodes for client-server communication (matches server)
export const OpCode = {
  STATE_UPDATE: 1,
  MAKE_MOVE: 2,

  // WebRTC Voice Chat Signaling
  WEBRTC_OFFER: 3,
  WEBRTC_ANSWER: 4,
  WEBRTC_ICE_CANDIDATE: 5,
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
