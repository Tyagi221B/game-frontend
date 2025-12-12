// services/nakama.ts - Nakama WebSocket connection service
// This is the BRIDGE between React and Nakama server

import { Client, Session } from "@heroiclabs/nakama-js";
import type { Socket } from "@heroiclabs/nakama-js";
import type { GameState } from "../types/game";
import { OpCode } from "../types/game";
import type { NakamaService as INakamaService, LeaderboardEntry, ConnectionStatus } from "../types/nakama";

// Nakama connection configuration
const SERVER_HOST = "localhost"; // Change to production URL when deploying
const SERVER_PORT = "7350"; // Nakama HTTP + WebSocket port
const USE_SSL = false; // Set to true in production

class NakamaService implements INakamaService {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private matchId: string | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Callback functions for React components to handle events
  public onMatchStateUpdate?: (state: GameState) => void;
  public onMatchJoined?: () => void;
  public onError?: (message: string) => void;
  public onConnectionStatusChange?: (status: ConnectionStatus) => void;

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

      // Store username in localStorage for session persistence
      localStorage.setItem("nakama_username", this.session.username || nickname);

      console.log("[Auth] Authenticated as:", this.session.username);
      return true;
    } catch (error: unknown) {
      console.error("[Auth] Authentication failed:", error);

      // Check if it's a 409 Conflict error (username already taken)
      if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
        this.onError?.(`Username "${nickname}" is already taken. Please choose another one.`);
      } else {
        this.onError?.("Failed to authenticate. Please try again.");
      }
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
      this.setConnectionStatus("connecting");

      // Create WebSocket connection
      this.socket = this.client.createSocket(USE_SSL, false);

      // Set up event listeners BEFORE connecting
      this.socket.onmatchdata = this.handleMatchData.bind(this);
      this.socket.ondisconnect = (evt) => {
        console.log("[Socket] Disconnected from server", evt);
        this.setConnectionStatus("disconnected");

        // Auto-reconnect if we have a session
        if (this.session && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      // Connect to Nakama server
      await this.socket.connect(this.session, true);
      console.log("[Socket] WebSocket connected!");

      // Small delay to ensure socket is fully ready for RPC calls
      await new Promise(resolve => setTimeout(resolve, 100));

      this.setConnectionStatus("connected");
      this.reconnectAttempts = 0; // Reset on successful connection

      return true;
    } catch (error) {
      console.error("[Socket] Connection failed:", error);
      this.setConnectionStatus("disconnected");
      this.onError?.("Failed to connect to server. Please try again.");
      return false;
    }
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30s

    console.log(`[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.setConnectionStatus("reconnecting");

    this.reconnectTimeout = setTimeout(async () => {
      console.log(`[Socket] Attempting reconnect #${this.reconnectAttempts}...`);
      const success = await this.connectSocket();

      if (!success && this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onError?.("Lost connection to server. Please refresh the page.");
      }
    }, delay);
  }

  // Set connection status and notify listeners
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      console.log(`[Connection] Status: ${status}`);
      this.onConnectionStatusChange?.(status);
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
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

  // Delete user data (leaderboard records)
  async deleteUserData(): Promise<boolean> {
    if (!this.socket) {
      console.error("[Delete] Socket not connected!");
      return false;
    }

    try {
      console.log("[Delete] ----------------------------------------");
      console.log("[Delete] Sending delete_user_data RPC to server...");
      console.log("[Delete] User ID:", this.getUserId());
      console.log("[Delete] Username:", this.getUsername());

      const response = await this.socket.rpc("delete_user_data", "");
      console.log("[Delete] RPC response received");

      const result = JSON.parse(response.payload as string);
      console.log("[Delete] Response parsed:", result);

      if (!result.success) {
        console.error("[Delete] ✗ Server reported failure:", result.error);
        console.log("[Delete] ----------------------------------------");
        return false;
      }

      console.log("[Delete] ✓ Server confirmed successful deletion");
      console.log("[Delete] ----------------------------------------");
      return true;
    } catch (error: unknown) {
      console.error("[Delete] ✗ Exception during deletion:", error);
      console.log("[Delete] ----------------------------------------");
      return false;
    }
  }

  // Logout - Clear device ID and full disconnect
  logout(): void {
    // Disconnect first
    this.disconnect();

    // Clear device ID and username from localStorage
    const DEVICE_ID_KEY = "nakama_device_id";
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem("nakama_username");
    console.log("[Nakama] Logged out - device ID and username cleared");
  }

  // Check if user is already authenticated
  isAuthenticated(): boolean {
    return this.session !== null && this.socket !== null;
  }

  // Check if device ID exists (user has logged in before)
  hasStoredIdentity(): boolean {
    const DEVICE_ID_KEY = "nakama_device_id";
    return localStorage.getItem(DEVICE_ID_KEY) !== null;
  }

  // Get stored username from localStorage
  getStoredUsername(): string | null {
    return localStorage.getItem("nakama_username");
  }
}

// Export singleton instance
// WHY: Only one connection needed across entire app
export const nakamaService = new NakamaService();
