import { useEffect, useState, useCallback } from "react";
import type { NakamaService, LeaderboardEntry } from "../types/nakama";
import type { GameState } from "../types/game";

interface LeaderboardProps {
  nakamaService: NakamaService;
  currentUserId?: string;
  gameState: GameState | null;
}

export default function Leaderboard({ nakamaService, currentUserId, gameState }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await nakamaService.getLeaderboard();
      setLeaderboard(result);
    } catch (error) {
      console.error("[Leaderboard] Failed to fetch:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [nakamaService]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Refresh leaderboard when game ends
  useEffect(() => {
    if (gameState?.status === "completed") {
      console.log("[Leaderboard] Game completed, refreshing...");
      setTimeout(() => fetchLeaderboard(), 1000); // Small delay to let server update
    }
  }, [gameState?.status, fetchLeaderboard]);

  // Mobile collapsed view - just a toggle button (desktop ignores this)
  const showCollapsed = !isExpanded;

  // Render collapsed button on mobile
  if (showCollapsed) {
    return (
      <>
        {/* Mobile: Compact toggle button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="sm:hidden bg-white/90 backdrop-blur-sm rounded-full shadow-xl p-3 border-2 border-white/50 hover:scale-110 transition-transform"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">🏆</span>
          </div>
        </button>

        {/* Desktop: Full leaderboard always visible */}
        <div className="hidden sm:block">
          {renderLeaderboard()}
        </div>
      </>
    );
  }

  // Mobile expanded or desktop
  return renderLeaderboard();

  function renderLeaderboard() {
    if (loading) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 border-2 border-white/50">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm sm:text-lg">🏆</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-800">Top Players</h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="sm:hidden text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-3 sm:py-4 text-gray-500 text-sm">Loading...</div>
        </div>
      );
    }

    if (leaderboard.length === 0) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 border-2 border-white/50">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm sm:text-lg">🏆</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-800">Top Players</h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="sm:hidden text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">
            No players yet. Be the first to win!
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 border-2 border-white/50">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-sm sm:text-lg">🏆</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-gray-800">Top Players</h2>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="sm:hidden text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {leaderboard.slice(0, 5).map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isTopThree = index < 3;

            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                  isCurrentUser
                    ? "bg-linear-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  {/* Rank */}
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shadow ${
                      isTopThree
                        ? "bg-linear-to-br from-amber-400 to-orange-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm sm:text-base truncate ${isCurrentUser ? "text-indigo-700" : "text-gray-800"}`}>
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-indigo-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="font-black text-sm sm:text-base text-gray-800">
                      {entry.wins}W - {entry.losses}L
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      {entry.winRate.toFixed(1)}% win rate
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
