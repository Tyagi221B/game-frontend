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
import { logger } from "./utils/logger";

// Screen types
type Screen = "login" | "matchmaking" | "game";

function App() {
  // State management
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusType>("disconnected");
  const [toasts, setToasts] = useState<Omit<ToastProps, "onDismiss">[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state during auth check

  // Modal state
  const [showLeaveMatchModal, setShowLeaveMatchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Auto-match state for "Play Again"
  const [autoMatchMode, setAutoMatchMode] = useState<
    "classic" | "timed" | null
  >(null);

  // Toast management
  const showToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      setIsCheckingAuth(true);

      if (nakamaService.hasStoredIdentity()) {
        const storedUsername = nakamaService.getStoredUsername();

        if (storedUsername) {
          logger.log(
            "📍 Found existing identity, re-authenticating as:",
            storedUsername
          );

          // Re-authenticate with stored credentials
          const authenticated = await nakamaService.authenticate(
            storedUsername
          );
          if (authenticated) {
            const connected = await nakamaService.connectSocket();
            if (connected) {
              setUsername(storedUsername);
              const userId = nakamaService.getUserId();
              if (userId) {
                setUserId(userId);
                setCurrentScreen("matchmaking");
                logger.log("✅ Auto-logged in as:", storedUsername);
              }
            }
          }
        }
      }

      setIsCheckingAuth(false);
    };

    checkExistingAuth();
  }, []);

  // Initialize Nakama event handlers on mount
  useEffect(() => {
    // Handle state updates from server
    nakamaService.onMatchStateUpdate = (state: GameState) => {
      logger.log("📥 Game state updated:", state);
      setGameState(state);

      // Auto-transition to game screen when match starts
      if (state.status === "active") {
        setCurrentScreen("game");
      }
    };

    // Handle match joined
    nakamaService.onMatchJoined = () => {
      logger.log("✅ Joined match successfully!");
      // Stay on matchmaking screen until opponent joins
    };

    // Handle errors
    nakamaService.onError = (errorMessage: string) => {
      logger.error("❌ Error:", errorMessage);
      showToast("error", errorMessage);
    };

    // Handle connection status changes
    nakamaService.onConnectionStatusChange = (status: ConnectionStatusType) => {
      logger.log("🔌 Connection status:", status);
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
        e.returnValue =
          "You're in an active game! Leaving will forfeit the match.";
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
  const handleFindMatch = useCallback(async (mode: "classic" | "timed") => {
    // Find/create a match with selected mode
    await nakamaService.findMatch(mode);
  }, []);

  // Auto-match when "Play Again" is clicked
  useEffect(() => {
    // If we're on matchmaking screen and autoMatchMode is set, trigger auto-match
    if (currentScreen === "matchmaking" && autoMatchMode) {
      logger.log("🔄 [PLAY AGAIN] Auto-matching in", autoMatchMode, "mode");

      // Small delay to let matchmaking screen mount
      const timer = setTimeout(() => {
        handleFindMatch(autoMatchMode);
        setAutoMatchMode(null); // Clear after triggering
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentScreen, autoMatchMode, handleFindMatch]);

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
    // Save current mode before clearing gameState
    const currentMode = gameState?.mode || "timed";

    logger.log("🔄 [PLAY AGAIN] Saving mode:", currentMode);

    // Clear game state and go to matchmaking
    setGameState(null);
    setCurrentScreen("matchmaking");

    // Trigger auto-match in same mode (useEffect will handle the actual match)
    setAutoMatchMode(currentMode);
  };

  // Handle back to home (go to matchmaking without reloading)
  const handleBackToHome = () => {
    logger.log("[BACK TO HOME] Returning to matchmaking");
    setGameState(null);
    setCurrentScreen("matchmaking");
  };

  // Step 4.5: Handle leave match (forfeit)
  const handleLeaveMatch = () => {
    setShowLeaveMatchModal(true);
  };

  const confirmLeaveMatch = async () => {
    setShowLeaveMatchModal(false);
    logger.log("🚪 [LEAVE] Player forfeiting match...");

    // Leave the match (server will handle forfeit logic)
    await nakamaService.leaveMatch();

    // Reset to matchmaking screen
    setGameState(null);
    setCurrentScreen("matchmaking");

    showToast("info", "You forfeited the match.");
    logger.log("✅ [LEAVE] Returned to matchmaking");
  };

  // Step 5: Handle logout
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    logger.log("========================================");
    logger.log("🚪 [LOGOUT] Starting logout process...");
    logger.log("🚪 [LOGOUT] Current user:", username, "| User ID:", userId);

    // Show loading toast
    showToast("info", "Deleting account... Please wait.");

    // Delete user data from server
    logger.log("🗑️ [LOGOUT] Calling server to delete user data...");
    const result = await nakamaService.deleteUserData();

    if (!result.success) {
      setIsLoggingOut(false);
      logger.error("✗ [LOGOUT] Failed to delete user data from server");
      logger.log("========================================");

      // Show retry option for timeout
      if (result.timeout) {
        showToast(
          "error",
          "Deletion timed out. The account may still be deleting. Please wait a moment and try again."
        );
      } else {
        showToast(
          "error",
          result.error || "Failed to delete user data. Please try again."
        );
      }
      return;
    }

    logger.log("✓ [LOGOUT] User data deleted from server successfully");
    logger.log("🗑️ [LOGOUT] Clearing localStorage...");

    // Clear everything
    nakamaService.logout();
    setUsername("");
    setUserId("");
    setGameState(null);
    setCurrentScreen("login");
    setIsLoggingOut(false);

    logger.log("✓ [LOGOUT] localStorage cleared");
    logger.log("✓ [LOGOUT] State reset to login screen");
    logger.log("✅ [LOGOUT] Logout completed successfully!");
    logger.log("========================================");

    showToast("success", "Logged out successfully. All data deleted.");
  };

  // Render current screen
  return (
    <div className="min-h-screen bg-black">
      {/* Loading Overlay during Logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-200">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-bold">Deleting account...</p>
            <p className="text-neutral-400 text-sm mt-2">
              Please wait, this may take a few seconds
            </p>
          </div>
        </div>
      )}

      {/* Connection Status Indicator */}
      <ConnectionStatus status={connectionStatus} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Login Screen - Only show if not checking auth */}
      {currentScreen === "login" && !isCheckingAuth && (
        <Login onLogin={handleLogin} />
      )}

      {/* Loading state during auth check */}
      {currentScreen === "login" && isCheckingAuth && (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-bold">Loading...</p>
          </div>
        </div>
      )}

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
              onBackToHome={handleBackToHome}
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
