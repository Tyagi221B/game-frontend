// components/GameStatus.tsx - Game result display

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "../types/game";
import { nakamaService } from "../services/nakama";
import Button from "./Button";
import { logger } from "../utils/logger";

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
  const [streakData, setStreakData] = useState<{
    winStreak: number;
    bestWinStreak: number;
  } | null>(null);

  // Fetch streak data when game completes
  useEffect(() => {
    if (gameState.status === "completed") {
      const fetchStreakData = async () => {
        try {
          const leaderboard = await nakamaService.getLeaderboard();
          const currentUserEntry = leaderboard.find(
            (entry) => entry.userId === currentUserId
          );
          if (currentUserEntry) {
            setStreakData({
              winStreak: currentUserEntry.winStreak || 0,
              bestWinStreak: currentUserEntry.bestWinStreak || 0,
            });
          } else {
            // User not in leaderboard yet, default to 0
            setStreakData({ winStreak: 0, bestWinStreak: 0 });
          }
        } catch (error) {
          logger.error("[GameStatus] Failed to fetch streak data:", error);
          setStreakData({ winStreak: 0, bestWinStreak: 0 });
        }
      };

      // Small delay to ensure server has updated streaks
      const timer = setTimeout(() => {
        fetchStreakData();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState.status, currentUserId]);

  // Determine result
  const isDraw = gameState.winner === "draw";
  const isWinner = gameState.winner === currentUserId;
  const winnerName = isDraw
    ? null
    : gameState.players[gameState.winner!]?.username;

  return (
    <AnimatePresence>
      {gameState.status === "completed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
            }}
            className="relative bg-black/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-orange-500/30 p-6 sm:p-8 md:p-10 w-full max-w-xs sm:max-w-md mx-4 border-2 border-orange-500/30"
          >
            {/* Confetti Effect (for winner) */}
            {isWinner && (
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1"></div>
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-confetti-2"></div>
                <div className="absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full animate-confetti-3"></div>
              </div>
            )}

            {/* Icon */}
            <div className="text-center mb-4 sm:mb-6">
              {isDraw ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-linear-to-br from-neutral-700 to-neutral-800 rounded-full flex items-center justify-center shadow-lg border-4 border-neutral-600">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              ) : isWinner ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-linear-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50 border-4 border-amber-300 animate-bounce-slow">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-linear-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 border-4 border-red-400">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Result Text */}
            <div className="text-center mb-6 sm:mb-8">
              {isDraw ? (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-neutral-300 to-neutral-500 mb-2 sm:mb-3">
                    It's a Draw!
                  </h2>
                  <p className="text-neutral-400 text-sm sm:text-base md:text-lg">
                    Well played by both players!
                  </p>
                </>
              ) : isWinner ? (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600 mb-2 sm:mb-3">
                    Victory! 🎉
                  </h2>
                  <p className="text-neutral-300 text-sm sm:text-base md:text-lg">
                    Congratulations on your epic win!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-600 mb-2 sm:mb-3">
                    Defeat
                  </h2>
                  <p className="text-neutral-400 text-sm sm:text-base md:text-lg">
                    <span className="font-bold text-white capitalize">
                      {winnerName}
                    </span>{" "}
                    won this round!
                  </p>
                </>
              )}
            </div>

            {/* Game Stats */}
            <div className="bg-linear-to-br from-orange-500/10 to-red-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 border border-orange-500/30 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center mb-3 sm:mb-4">
                <div>
                  <p className="text-neutral-400 text-xs sm:text-sm mb-2 font-semibold uppercase tracking-wide">
                    Your Symbol
                  </p>
                  <div
                    className={`text-3xl sm:text-4xl font-black ${
                      gameState.players[currentUserId]?.symbol === "X"
                        ? "text-[#E50914] drop-shadow-[0_0_10px_rgba(229,9,20,0.5)]"
                        : "text-[#0080FF] drop-shadow-[0_0_10px_rgba(0,128,255,0.5)]"
                    }`}
                  >
                    {gameState.players[currentUserId]?.symbol}
                  </div>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs sm:text-sm mb-2 font-semibold uppercase tracking-wide">
                    Result
                  </p>
                  <div
                    className={`text-xl sm:text-2xl font-black ${
                      isDraw
                        ? "text-neutral-400"
                        : isWinner
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {isDraw ? "Draw" : isWinner ? "Win" : "Loss"}
                  </div>
                </div>
              </div>

              {/* Win Streak Display */}
              {streakData && (
                <div className="border-t border-orange-500/20 pt-3 sm:pt-4">
                  {isWinner && streakData.winStreak > 0 ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-lg sm:text-xl">🔥</span>
                        <p className="text-sm sm:text-base font-bold text-orange-400">
                          Win Streak: {streakData.winStreak}!
                        </p>
                      </div>
                      {streakData.winStreak >= 5 && (
                        <p className="text-xs sm:text-sm text-amber-400 font-semibold">
                          {streakData.winStreak >= 10
                            ? "🎉 INCREDIBLE!"
                            : streakData.winStreak >= 5
                            ? "🌟 Amazing!"
                            : ""}
                        </p>
                      )}
                      {streakData.bestWinStreak > streakData.winStreak && (
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-1">
                          Best: {streakData.bestWinStreak}
                        </p>
                      )}
                    </div>
                  ) : !isWinner &&
                    streakData.winStreak === 0 &&
                    streakData.bestWinStreak > 0 ? (
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-neutral-400">
                        Streak ended. Best:{" "}
                        <span className="text-orange-400 font-semibold">
                          {streakData.bestWinStreak}
                        </span>
                      </p>
                    </div>
                  ) : (
                    streakData.bestWinStreak > 0 && (
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-neutral-400">
                          Best Win Streak:{" "}
                          <span className="text-orange-400 font-semibold">
                            {streakData.bestWinStreak}
                          </span>
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button onClick={onPlayAgain} variant="success">
                <span className="flex items-center justify-center gap-2">
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Play Again
                </span>
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                <span className="flex items-center justify-center gap-2">
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Back to Home
                </span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
