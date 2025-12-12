// components/GameStatus.tsx - Game result display

import type { GameState } from "../types/game";

interface GameStatusProps {
  gameState: GameState;
  currentUserId: string;
  onPlayAgain: () => void;
}

export default function GameStatus({
  gameState,
  currentUserId,
  onPlayAgain,
}: GameStatusProps) {
  // Only show if game is completed
  if (gameState.status !== "completed") {
    return null;
  }

  // Determine result
  const isDraw = gameState.winner === "draw";
  const isWinner = gameState.winner === currentUserId;
  const winnerName = isDraw
    ? null
    : gameState.players[gameState.winner!]?.username;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 w-full max-w-md mx-4 border-4 border-white/50">
        {/* Confetti Effect (for winner) */}
        {isWinner && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1"></div>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-confetti-2"></div>
            <div className="absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full animate-confetti-3"></div>
          </div>
        )}

        {/* Icon */}
        <div className="text-center mb-6">
          {isDraw ? (
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          ) : isWinner ? (
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-300 animate-bounce-slow">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg border-4 border-red-300">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Result Text */}
        <div className="text-center mb-8">
          {isDraw ? (
            <>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800 mb-3">
                It's a Draw!
              </h2>
              <p className="text-gray-600 text-lg">Well played by both players!</p>
            </>
          ) : isWinner ? (
            <>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600 mb-3">
                Victory! 🎉
              </h2>
              <p className="text-gray-600 text-lg">Congratulations on your epic win!</p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 mb-3">
                Defeat
              </h2>
              <p className="text-gray-600 text-lg">
                <span className="font-bold text-gray-800">{winnerName}</span> won this round!
              </p>
            </>
          )}
        </div>

        {/* Game Stats */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-indigo-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-500 text-sm mb-2 font-semibold uppercase tracking-wide">Your Symbol</p>
              <div className={`text-4xl font-black ${gameState.players[currentUserId]?.symbol === "X" ? "text-indigo-600" : "text-pink-600"}`}>
                {gameState.players[currentUserId]?.symbol}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2 font-semibold uppercase tracking-wide">Result</p>
              <div className={`text-2xl font-black ${isDraw ? "text-gray-600" : isWinner ? "text-green-600" : "text-red-600"}`}>
                {isDraw ? "Draw" : isWinner ? "Win" : "Loss"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2 text-black py-2 rounded-4xl bg-green-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Play Again
            </span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
