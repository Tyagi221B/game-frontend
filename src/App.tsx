// App.tsx - Main application component with state management

import { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Matchmaking from "./components/Matchmaking";
import GameBoard from "./components/GameBoard";
import GameStatus from "./components/GameStatus";
import Leaderboard from "./components/Leaderboard";
import ConnectionStatus from "./components/ConnectionStatus";
import ToastContainer from "./components/ToastContainer";
import { nakamaService } from "./services/nakama";
import type { GameState } from "./types/game";
import type { ConnectionStatus as ConnectionStatusType } from "./types/nakama";
import type { ToastProps, ToastType } from "./components/Toast";

// Screen types
type Screen = "login" | "matchmaking" | "game";

function App() {
  // State management
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>("disconnected");
  const [toasts, setToasts] = useState<Omit<ToastProps, "onDismiss">[]>([]);

  // Toast management
  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      if (nakamaService.hasStoredIdentity()) {
        const storedUsername = nakamaService.getStoredUsername();

        if (storedUsername) {
          console.log("📍 Found existing identity, re-authenticating as:", storedUsername);

          // Re-authenticate with stored credentials
          const authenticated = await nakamaService.authenticate(storedUsername);
          if (authenticated) {
            const connected = await nakamaService.connectSocket();
            if (connected) {
              setUsername(storedUsername);
              const userId = nakamaService.getUserId();
              if (userId) {
                setUserId(userId);
                setCurrentScreen("matchmaking");
                console.log("✅ Auto-logged in as:", storedUsername);
              }
            }
          }
        }
      }
    };

    checkExistingAuth();
  }, []);

  // Initialize Nakama event handlers on mount
  useEffect(() => {
    // Handle state updates from server
    nakamaService.onMatchStateUpdate = (state: GameState) => {
      console.log("📥 Game state updated:", state);
      setGameState(state);

      // Auto-transition to game screen when match starts
      if (state.status === "active") {
        setCurrentScreen("game");
      }
    };

    // Handle match joined
    nakamaService.onMatchJoined = () => {
      console.log("✅ Joined match successfully!");
      // Stay on matchmaking screen until opponent joins
    };

    // Handle errors
    nakamaService.onError = (errorMessage: string) => {
      console.error("❌ Error:", errorMessage);
      showToast("error", errorMessage);
    };

    // Handle connection status changes
    nakamaService.onConnectionStatusChange = (status: ConnectionStatusType) => {
      console.log("🔌 Connection status:", status);
      setConnectionStatus(status);
    };

    // Cleanup only on component unmount
    return () => {
      nakamaService.disconnect();
    };
  }, [showToast]); // Run only once on mount

  // Step 1: Handle login
  const handleLogin = async (nickname: string) => {
    setUsername(nickname);

    // Authenticate with Nakama
    const authenticated = await nakamaService.authenticate(nickname);
    if (!authenticated) {
      // Username is taken or authentication failed - stay on login screen
      setUsername("");
      return;
    }

    // Connect WebSocket
    const connected = await nakamaService.connectSocket();
    if (!connected) {
      return;
    }

    // Get user ID
    const id = nakamaService.getUserId();
    if (id) {
      setUserId(id);
      setCurrentScreen("matchmaking");
      showToast("success", `Welcome, ${nickname}!`);
    }
  };

  // Step 2: Handle matchmaking
  const handleFindMatch = async () => {
    // Find/create a match
    await nakamaService.findMatch();
  };

  // Step 3: Handle cell click in game
  const handleCellClick = async (position: number) => {
    if (!gameState) return;

    // Send move to server
    await nakamaService.sendMove(position);
  };

  // Step 4: Handle play again
  const handlePlayAgain = async () => {
    setGameState(null);
    setCurrentScreen("matchmaking");

    // Find new match
    await handleFindMatch();
  };

  // Step 5: Handle logout
  const handleLogout = async () => {
    console.log("========================================");
    console.log("🚪 [LOGOUT] Starting logout process...");
    console.log("🚪 [LOGOUT] Current user:", username, "| User ID:", userId);

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to logout?\n\n" +
      "⚠️ You will lose:\n" +
      "• All your scores and progress\n" +
      "• Your username (it will become available for others)\n" +
      "• All leaderboard data\n\n" +
      "This action cannot be undone!"
    );

    if (!confirmed) {
      console.log("❌ [LOGOUT] Logout cancelled by user");
      console.log("========================================");
      return;
    }

    console.log("✓ [LOGOUT] User confirmed logout");

    // Delete user data from server
    console.log("🗑️ [LOGOUT] Calling server to delete user data...");
    const deleted = await nakamaService.deleteUserData();

    if (!deleted) {
      console.error("✗ [LOGOUT] Failed to delete user data from server");
      console.log("========================================");
      showToast("error", "Failed to delete user data. Please try again.");
      return;
    }

    console.log("✓ [LOGOUT] User data deleted from server successfully");
    console.log("🗑️ [LOGOUT] Clearing localStorage...");

    // Clear everything
    nakamaService.logout();
    setUsername("");
    setUserId("");
    setGameState(null);
    setCurrentScreen("login");

    console.log("✓ [LOGOUT] localStorage cleared");
    console.log("✓ [LOGOUT] State reset to login screen");
    console.log("✅ [LOGOUT] Logout completed successfully!");
    console.log("========================================");

    showToast("success", "Logged out successfully. All data deleted.");
  };

  // Render current screen
  return (
    <div className="min-h-screen bg-black">
      {/* Connection Status Indicator */}
      <ConnectionStatus status={connectionStatus} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Login Screen */}
      {currentScreen === "login" && <Login onLogin={handleLogin} />}

      {/* Matchmaking Screen */}
      {currentScreen === "matchmaking" && (
        <Matchmaking
          username={username}
          onFindMatch={handleFindMatch}
          onLogout={handleLogout}
        />
      )}

      {/* Game Screen */}
      {currentScreen === "game" && gameState && (
        <div className="min-h-screen flex items-center justify-center bg-black py-8 p-4">
          {/* Animated Orange/Red Glow Blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-linear-to-br from-orange-500/30 via-red-500/20 to-transparent rounded-full blur-3xl animate-glow-pulse"></div>
            <div className="absolute bottom-20 right-10 w-125 h-125 bg-linear-to-tl from-red-600/30 via-orange-600/20 to-transparent rounded-full blur-3xl animate-glow-pulse-delayed"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-r from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="relative w-full max-w-4xl px-4">
            {/* Game Board */}
            <GameBoard
              gameState={gameState}
              currentUserId={userId}
              onCellClick={handleCellClick}
            />

            {/* Game Status Modal (only shows when game completed) */}
            <GameStatus
              gameState={gameState}
              currentUserId={userId}
              onPlayAgain={handlePlayAgain}
            />
          </div>
        </div>
      )}

      {/* Fixed Leaderboard - Top Right (hide on login) */}
      {currentScreen !== "login" && (
        <div className="fixed top-4 right-4 w-56 sm:w-72 lg:w-80 max-h-[40vh] sm:max-h-[calc(100vh-2rem)] overflow-y-auto z-50">
          <Leaderboard
            nakamaService={nakamaService}
            currentUserId={nakamaService.getUserId() || undefined}
            gameState={gameState}
            connectionStatus={connectionStatus}
          />
        </div>
      )}
    </div>
  );
}

export default App;
