// services/nakama.ts - Nakama WebSocket connection service
// This is the BRIDGE between React and Nakama server

import { Client, Session } from "@heroiclabs/nakama-js";
import type { Socket } from "@heroiclabs/nakama-js";
import type { GameState } from "../types/game";
import { OpCode } from "../types/game";
import type { NakamaService as INakamaService, LeaderboardEntry } from "../types/nakama";

// Nakama connection configuration
const SERVER_HOST = "localhost"; // Change to production URL when deploying
const SERVER_PORT = "7350"; // Nakama HTTP + WebSocket port
const USE_SSL = false; // Set to true in production

class NakamaService implements INakamaService {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private matchId: string | null = null;

  // Callback functions for React components to handle events
  public onMatchStateUpdate: ((state: GameState) => void) | null = null;
  public onMatchJoined: (() => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor() {
    // Initialize Nakama client
    this.client = new Client("defaultkey", SERVER_HOST, SERVER_PORT, USE_SSL);
    console.log("[Nakama] Client initialized");
  }

  // Step 1: Authenticate with nickname (device authentication)
  // WHY: Creates a user session without requiring email/password
  async authenticate(nickname: string): Promise<boolean> {
    try {
      // Device authentication - creates anonymous account tied to device
      // In production, you'd use a more secure method or store deviceId
      const deviceId = this.getOrCreateDeviceId();

      this.session = await this.client.authenticateDevice(deviceId, true, nickname);

      console.log("[Auth] Authenticated as:", this.session.username);
      return true;
    } catch (error) {
      console.error("[Auth] Authentication failed:", error);
      this.onError?.("Failed to authenticate. Please try again.");
      return false;
    }
  }

  // Step 2: Connect WebSocket for real-time communication
  async connectSocket(): Promise<boolean> {
    if (!this.session) {
      console.error("[Socket] No session found. Authenticate first!");
      return false;
    }

    try {
      // Create WebSocket connection
      this.socket = this.client.createSocket(USE_SSL, false);

      // Set up event listeners BEFORE connecting
      this.socket.onmatchdata = this.handleMatchData.bind(this);
      this.socket.ondisconnect = () => {
        console.log("[Socket] Disconnected from server");
      };

      // Connect to Nakama server
      await this.socket.connect(this.session, true);
      console.log("[Socket] WebSocket connected!");

      return true;
    } catch (error) {
      console.error("[Socket] Connection failed:", error);
      this.onError?.("Failed to connect to server. Please try again.");
      return false;
    }
  }

  // Step 3: Find a match using RPC
  // WHY: Server handles finding/creating matches to avoid race conditions
  async findMatch(): Promise<boolean> {
    if (!this.socket) {
      console.error("[Match] Socket not connected!");
      return false;
    }

    try {
      console.log("[Match] Calling find_match RPC...");

      // Call server RPC to find or create a match
      const response = await this.socket.rpc("find_match", "");
      const result = JSON.parse(response.payload as string);
      const matchId = result.matchId;

      console.log("[Match] RPC returned match ID:", matchId);

      // Join the match
      const match = await this.socket.joinMatch(matchId);

      if (match) {
        this.matchId = match.match_id;
        console.log("[Match] Successfully joined match:", this.matchId);
        this.onMatchJoined?.();
        return true;
      }

      return false;
    } catch (error) {
      console.error("[Match] Failed to find/join match:", error);
      this.onError?.("Failed to find match. Please try again.");
      return false;
    }
  }

  // Alternative: Join existing match by ID
  async joinMatch(matchId: string): Promise<boolean> {
    if (!this.socket) {
      console.error("[Match] Socket not connected!");
      return false;
    }

    try {
      const match = await this.socket.joinMatch(matchId);

      if (match) {
        this.matchId = match.match_id;
        console.log("[Match] Joined match:", this.matchId);
        this.onMatchJoined?.();
        return true;
      }

      return false;
    } catch (error) {
      console.error("[Match] Failed to join match:", error);
      this.onError?.("Failed to join match. Please try again.");
      return false;
    }
  }

  // Step 4: Send move to server
  // WHY: Tell server we clicked a cell
  async sendMove(position: number): Promise<void> {
    if (!this.socket || !this.matchId) {
      console.error("[Game] Not in a match!");
      return;
    }

    try {
      const data = { position };

      // Send MAKE_MOVE message to server
      await this.socket.sendMatchState(
        this.matchId,
        OpCode.MAKE_MOVE,
        JSON.stringify(data)
      );

      console.log("[Game] Sent move:", position);
    } catch (error) {
      console.error("[Game] Failed to send move:", error);
      this.onError?.("Failed to send move. Please try again.");
    }
  }

  // Fetch leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.socket) {
      console.error("[Leaderboard] Socket not connected!");
      return [];
    }

    try {
      console.log("[Leaderboard] Fetching top players...");
      const response = await this.socket.rpc("get_leaderboard", "");
      const result = JSON.parse(response.payload as string);

      console.log("[Leaderboard] Received:", result.leaderboard?.length || 0, "players");
      return result.leaderboard || [];
    } catch (error) {
      console.error("[Leaderboard] Failed to fetch:", error);
      return [];
    }
  }

  // Step 5: Handle incoming messages from server
  // WHY: Receive game state updates and display them
  private handleMatchData(matchData: { op_code: number; data: Uint8Array }): void {
    try {
      // Parse incoming message
      const opCode = matchData.op_code;
      const data = matchData.data;

      // Decode data based on OpCode
      switch (opCode) {
        case OpCode.STATE_UPDATE: {
          // Server sent updated game state
          const decoder = new TextDecoder();
          const stateJson = decoder.decode(data);
          const gameState: GameState = JSON.parse(stateJson);

          console.log("[Game] Received state update:", gameState);
          this.onMatchStateUpdate?.(gameState);
          break;
        }

        default:
          console.warn("[Game] Unknown OpCode:", opCode);
      }
    } catch (error) {
      console.error("[Game] Error handling match data:", error);
    }
  }

  // Helper: Get or create device ID for authentication
  private getOrCreateDeviceId(): string {
    const DEVICE_ID_KEY = "nakama_device_id";
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate random device ID
      deviceId = this.generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  }

  // Helper: Generate UUID for device ID
  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Get current user ID
  getUserId(): string | null {
    return this.session?.user_id || null;
  }

  // Get current username
  getUsername(): string | null {
    return this.session?.username || null;
  }

  // Disconnect from server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect(true);
      this.socket = null;
    }
    this.session = null;
    this.matchId = null;
    console.log("[Nakama] Disconnected");
  }
}

// Export singleton instance
// WHY: Only one connection needed across entire app
export const nakamaService = new NakamaService();
