// App.tsx - Main application component with state management

import { useState, useEffect } from "react";
import Login from "./components/Login";
import Matchmaking from "./components/Matchmaking";
import GameBoard from "./components/GameBoard";
import GameStatus from "./components/GameStatus";
import Leaderboard from "./components/Leaderboard";
import { nakamaService } from "./services/nakama";
import type { GameState } from "./types/game";

// Screen types
type Screen = "login" | "matchmaking" | "game";

function App() {
  // State management
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState("");

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
      setError(errorMessage);
    };

    // Cleanup only on component unmount
    return () => {
      nakamaService.disconnect();
    };
  }, []); // Run only once on mount

  // Step 1: Handle login
  const handleLogin = async (nickname: string) => {
    setError("");
    setUsername(nickname);

    // Authenticate with Nakama
    const authenticated = await nakamaService.authenticate(nickname);
    if (!authenticated) {
      setError("Failed to authenticate. Please try again.");
      return;
    }

    // Connect WebSocket
    const connected = await nakamaService.connectSocket();
    if (!connected) {
      setError("Failed to connect to server. Please try again.");
      return;
    }

    // Get user ID
    const id = nakamaService.getUserId();
    if (id) {
      setUserId(id);
      setCurrentScreen("matchmaking");
    }
  };

  // Step 2: Handle matchmaking
  const handleFindMatch = async () => {
    setError("");

    // Find/create a match
    const matchFound = await nakamaService.findMatch();
    if (!matchFound) {
      setError("Failed to find match. Please try again.");
    }
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

  // Render current screen
  return (
    <div className="min-h-screen">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Login Screen */}
      {currentScreen === "login" && <Login onLogin={handleLogin} />}

      {/* Matchmaking Screen */}
      {currentScreen === "matchmaking" && (
        <Matchmaking
          username={username}
          onFindMatch={handleFindMatch}
        />
      )}

      {/* Game Screen */}
      {currentScreen === "game" && gameState && (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 py-8 p-4">
          {/* Animated Background Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
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
          />
        </div>
      )}
    </div>
  );
}

export default App;
