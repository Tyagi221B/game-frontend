// services/nakama.ts - Nakama WebSocket connection service
// This is the BRIDGE between React and Nakama server

import { Client, Session } from "@heroiclabs/nakama-js";
import type { Socket } from "@heroiclabs/nakama-js";
import type { GameState } from "../types/game";
import { OpCode } from "../types/game";
import type { NakamaService as INakamaService, LeaderboardEntry, ConnectionStatus } from "../types/nakama";
import { logger } from "../utils/logger";

// Nakama connection configuration
const SERVER_HOST = import.meta.env.VITE_NAKAMA_HOST || "localhost";
const SERVER_PORT = import.meta.env.VITE_NAKAMA_PORT || "7350";
const USE_SSL = import.meta.env.VITE_NAKAMA_SSL === "true";

class NakamaService implements INakamaService {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private matchId: string | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isLoggingOut = false; // Flag to suppress connection errors during logout

  // Callback functions for React components to handle events
  public onMatchStateUpdate?: (state: GameState) => void;
  public onMatchJoined?: () => void;
  public onError?: (message: string) => void;
  public onConnectionStatusChange?: (status: ConnectionStatus) => void;

  constructor() {
    // Initialize Nakama client
    this.client = new Client("defaultkey", SERVER_HOST, SERVER_PORT, USE_SSL);
    logger.log("[Nakama] Client initialized");
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

      logger.log("[Auth] Authenticated as:", this.session.username);
      return true;
    } catch (error: unknown) {
      logger.error("[Auth] Authentication failed:", error);

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
      logger.error("[Socket] No session found. Authenticate first!");
      return false;
    }

    try {
      this.setConnectionStatus("connecting");

      // Create WebSocket connection
      this.socket = this.client.createSocket(USE_SSL, false);

      // Set up event listeners BEFORE connecting
      this.socket.onmatchdata = this.handleMatchData.bind(this);
      this.socket.ondisconnect = (evt) => {
        logger.log("[Socket] Disconnected from server", evt);
        this.setConnectionStatus("disconnected");

        // Don't show connection errors or reconnect during logout
        if (this.isLoggingOut) {
          logger.log("[Socket] Disconnect during logout - suppressing reconnection");
          return;
        }

        // Auto-reconnect if we have a session AND reconnection is enabled
        if (this.session && this.maxReconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      // Connect to Nakama server
      await this.socket.connect(this.session, true);
      logger.log("[Socket] WebSocket connected!");

      // Small delay to ensure socket is fully ready for RPC calls
      await new Promise(resolve => setTimeout(resolve, 100));

      this.setConnectionStatus("connected");
      this.reconnectAttempts = 0; // Reset on successful connection

      return true;
    } catch (error) {
      logger.error("[Socket] Connection failed:", error);
      this.setConnectionStatus("disconnected");

      // Don't show connection errors during logout
      if (!this.isLoggingOut) {
        this.onError?.("Failed to connect to server. Please try again.");
      }

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

    logger.log(`[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.setConnectionStatus("reconnecting");

    this.reconnectTimeout = setTimeout(async () => {
      logger.log(`[Socket] Attempting reconnect #${this.reconnectAttempts}...`);
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
      logger.log(`[Connection] Status: ${status}`);
      this.onConnectionStatusChange?.(status);
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Step 3: Find a match using RPC
  // WHY: Server handles finding/creating matches to avoid race conditions
  async findMatch(mode: string = "timed"): Promise<boolean> {
    if (!this.socket) {
      logger.error("[Match] Socket not connected!");
      return false;
    }

    try {
      logger.log("[Match] Calling find_match RPC with mode:", mode);

      // Call server RPC to find or create a match
      const response = await this.socket.rpc("find_match", JSON.stringify({ mode }));
      const result = JSON.parse(response.payload as string);
      const matchId = result.matchId;

      logger.log("[Match] RPC returned match ID:", matchId);

      // Join the match
      const match = await this.socket.joinMatch(matchId);

      if (match) {
        this.matchId = match.match_id;
        logger.log("[Match] Successfully joined match:", this.matchId);
        this.onMatchJoined?.();
        return true;
      }

      return false;
    } catch (error) {
      logger.error("[Match] Failed to find/join match:", error);
      this.onError?.("Failed to find match. Please try again.");
      return false;
    }
  }

  // Cancel matchmaking (leave current match)
  async cancelMatch(): Promise<void> {
    if (!this.socket || !this.matchId) {
      logger.log("[Match] No active match to cancel");
      return;
    }

    try {
      logger.log("[Match] Canceling match:", this.matchId);
      await this.socket.leaveMatch(this.matchId);
      this.matchId = null;
      logger.log("[Match] Left match successfully");
    } catch (error) {
      logger.error("[Match] Failed to leave match:", error);
    }
  }

  // Leave active match (forfeit)
  async leaveMatch(): Promise<void> {
    if (!this.socket || !this.matchId) {
      logger.log("[Match] No active match to leave");
      return;
    }

    try {
      logger.log("[Match] Leaving active match (forfeit):", this.matchId);
      await this.socket.leaveMatch(this.matchId);
      this.matchId = null;
      logger.log("[Match] Forfeited match successfully");
    } catch (error) {
      logger.error("[Match] Failed to leave match:", error);
    }
  }

  // Alternative: Join existing match by ID
  async joinMatch(matchId: string): Promise<boolean> {
    if (!this.socket) {
      logger.error("[Match] Socket not connected!");
      return false;
    }

    try {
      const match = await this.socket.joinMatch(matchId);

      if (match) {
        this.matchId = match.match_id;
        logger.log("[Match] Joined match:", this.matchId);
        this.onMatchJoined?.();
        return true;
      }

      return false;
    } catch (error) {
      logger.error("[Match] Failed to join match:", error);
      this.onError?.("Failed to join match. Please try again.");
      return false;
    }
  }

  // Step 4: Send move to server
  // WHY: Tell server we clicked a cell
  async sendMove(position: number): Promise<void> {
    if (!this.socket || !this.matchId) {
      logger.error("[Game] Not in a match!");
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

      logger.log("[Game] Sent move:", position);
    } catch (error) {
      logger.error("[Game] Failed to send move:", error);
      this.onError?.("Failed to send move. Please try again.");
    }
  }

  // Fetch leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.socket) {
      logger.error("[Leaderboard] Socket not connected!");
      return [];
    }

    try {
      logger.log("[Leaderboard] Fetching top players...");
      const response = await this.socket.rpc("get_leaderboard", "");
      const result = JSON.parse(response.payload as string);

      logger.log("[Leaderboard] Received:", result.leaderboard?.length || 0, "players");
      return result.leaderboard || [];
    } catch (error) {
      logger.error("[Leaderboard] Failed to fetch:", error);
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

          logger.log("[Game] Received state update:", gameState);
          this.onMatchStateUpdate?.(gameState);
          break;
        }

        default:
          logger.warn("[Game] Unknown OpCode:", opCode);
      }
    } catch (error) {
      logger.error("[Game] Error handling match data:", error);
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
    logger.log("[Nakama] Disconnected");
  }

  // Delete user data (leaderboard records)
  // Returns: { success: boolean, error?: string, timeout?: boolean }
  async deleteUserData(): Promise<{ success: boolean; error?: string; timeout?: boolean }> {
    if (!this.socket) {
      logger.error("[Delete] Socket not connected!");
      return { success: false, error: "Socket not connected" };
    }

    // Prevent multiple simultaneous delete calls
    if (this.isLoggingOut) {
      logger.warn("[Delete] Delete already in progress");
      return { success: false, error: "Delete already in progress" };
    }

    this.isLoggingOut = true; // Set flag to suppress connection errors

    // Disable auto-reconnect to prevent connection errors after account deletion
    const originalMaxReconnect = this.maxReconnectAttempts;
    this.maxReconnectAttempts = 0;

    try {
      logger.log("[Delete] ========================================");
      logger.log("[Delete] Starting user data deletion...");
      logger.log("[Delete] User ID:", this.getUserId());
      logger.log("[Delete] Username:", this.getUsername());

      let socketDisconnected = false;
      const disconnectHandler = () => {
        socketDisconnected = true;
      };
      const originalDisconnect = this.socket.ondisconnect;
      this.socket.ondisconnect = disconnectHandler;

      try {
        // Make delete call with 8-second timeout (production-grade timeout)
        const deletePromise = this.socket.rpc("delete_user_data", "");
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 8000)
        );

        // RPC response type from Nakama: { payload: string | Uint8Array }
        type RpcResponse = { payload: string | Uint8Array };
        const response = await Promise.race([deletePromise, timeoutPromise]) as RpcResponse;

        // Restore disconnect handler
        this.socket.ondisconnect = originalDisconnect;

        // If we got a response, parse it
        if (response && response.payload) {
          const result = JSON.parse(response.payload as string);
          if (!result.success) {
            logger.error("[Delete] ✗ Server reported failure:", result.error);
            this.maxReconnectAttempts = originalMaxReconnect;
            this.isLoggingOut = false;
            return { success: false, error: result.error || "Server reported failure" };
          }
          logger.log("[Delete] ✓ Server confirmed successful deletion");
          // Disconnect after successful response
          this.disconnect();
          this.maxReconnectAttempts = originalMaxReconnect;
          this.isLoggingOut = false;
          logger.log("[Delete] ========================================");
          return { success: true };
        }

        // If we got a response but no payload, treat as success (unlikely but handle gracefully)
        logger.warn("[Delete] ⚠ Response received but no payload");
        this.disconnect();
        this.maxReconnectAttempts = originalMaxReconnect;
        this.isLoggingOut = false;
        logger.log("[Delete] ========================================");
        return { success: true };
      } catch (error: unknown) {
        // Restore disconnect handler
        if (this.socket) {
          this.socket.ondisconnect = originalDisconnect;
        }

        // Check if socket disconnected (expected behavior when account is deleted)
        if (socketDisconnected || (error && typeof error === 'object' && 'message' in error &&
          String(error.message).includes('timeout'))) {

          // If socket disconnected, deletion likely succeeded
          if (socketDisconnected) {
            logger.log("[Delete] ✓ Socket disconnected - account deletion completed");
            this.disconnect();
            this.maxReconnectAttempts = originalMaxReconnect;
            this.isLoggingOut = false;
            logger.log("[Delete] ========================================");
            return { success: true };
          }

          // If timeout but socket still connected, might be a real issue
          logger.warn("[Delete] ⚠ Timeout waiting for response (socket still connected)");
          this.maxReconnectAttempts = originalMaxReconnect;
          this.isLoggingOut = false;
          logger.log("[Delete] ========================================");
          return { success: false, error: "Request timed out", timeout: true };
        }

        // Other errors
        throw error;
      }
    } catch (error: unknown) {
      logger.error("[Delete] ✗ Exception during deletion:", error);
      this.maxReconnectAttempts = originalMaxReconnect;
      this.isLoggingOut = false;
      logger.log("[Delete] ========================================");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  // Logout - Clear device ID and full disconnect
  logout(): void {
    // Reset logout flag
    this.isLoggingOut = false;

    // Disconnect first
    this.disconnect();

    // Clear device ID and username from localStorage
    const DEVICE_ID_KEY = "nakama_device_id";
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem("nakama_username");
    logger.log("[Nakama] Logged out - device ID and username cleared");
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
