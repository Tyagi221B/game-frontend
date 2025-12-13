// App.tsx - Main application component with state management

import { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Matchmaking from "./components/Matchmaking";
import GameBoard from "./components/GameBoard";
import GameStatus from "./components/GameStatus";
import Leaderboard from "./components/Leaderboard";
import ConnectionStatus from "./components/ConnectionStatus";
import ToastContainer from "./components/ToastContainer";
import ConfirmationModal from "./components/ConfirmationModal";
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

  // Modal state
  const [showLeaveMatchModal, setShowLeaveMatchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  // Warn user before refreshing/closing tab during active game
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if game is actively being played
      if (gameState?.status === "active") {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we still need to set returnValue
        e.returnValue = "You're in an active game! Leaving will forfeit the match.";
        return "You're in an active game! Leaving will forfeit the match.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameState?.status]);

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
  const handleFindMatch = async (mode: "classic" | "timed") => {
    // Find/create a match with selected mode
    await nakamaService.findMatch(mode);
  };

  // Step 2.5: Handle cancel matchmaking
  const handleCancelMatch = async () => {
    await nakamaService.cancelMatch();
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
    // User will select mode again on matchmaking screen
  };

  // Step 4.5: Handle leave match (forfeit)
  const handleLeaveMatch = () => {
    setShowLeaveMatchModal(true);
  };

  const confirmLeaveMatch = async () => {
    setShowLeaveMatchModal(false);
    console.log("🚪 [LEAVE] Player forfeiting match...");

    // Leave the match (server will handle forfeit logic)
    await nakamaService.leaveMatch();

    // Reset to matchmaking screen
    setGameState(null);
    setCurrentScreen("matchmaking");

    showToast("info", "You forfeited the match.");
    console.log("✅ [LEAVE] Returned to matchmaking");
  };

  // Step 5: Handle logout
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    console.log("========================================");
    console.log("🚪 [LOGOUT] Starting logout process...");
    console.log("🚪 [LOGOUT] Current user:", username, "| User ID:", userId);

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
          onCancelMatch={handleCancelMatch}
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
              onLeaveMatch={handleLeaveMatch}
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

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showLeaveMatchModal}
        title="Leave Match?"
        message="Are you sure you want to leave this game?"
        warnings={[
          "You will forfeit the match",
          "Your opponent will win",
          "This will count as a loss",
        ]}
        confirmText="Leave Match"
        cancelText="Stay"
        confirmVariant="danger"
        onConfirm={confirmLeaveMatch}
        onCancel={() => setShowLeaveMatchModal(false)}
      />

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout & Delete Data?"
        message="This will permanently delete all your data."
        warnings={[
          "All your scores and progress will be lost",
          "Your username will become available for others",
          "All leaderboard data will be deleted",
          "This action cannot be undone",
        ]}
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}

export default App;
