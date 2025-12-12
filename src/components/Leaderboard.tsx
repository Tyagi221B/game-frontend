import { useEffect, useState, useCallback } from "react";
import type { NakamaService, LeaderboardEntry } from "../types/nakama";
import type { GameState } from "../types/game";
import type { ConnectionStatus } from "../types/nakama";

interface LeaderboardProps {
  nakamaService: NakamaService;
  currentUserId?: string;
  gameState: GameState | null;
  connectionStatus: ConnectionStatus;
}

export default function Leaderboard({ nakamaService, currentUserId, gameState, connectionStatus }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    // Only fetch if connected
    if (connectionStatus !== "connected") {
      console.log("[Leaderboard] Skipping fetch - not connected yet");
      return;
    }

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
  }, [nakamaService, connectionStatus]);

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
          className="sm:hidden bg-black/80 backdrop-blur-sm rounded-full shadow-xl shadow-amber-500/20 p-3 border-2 border-amber-500/50 hover:scale-110 transition-transform"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
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
        <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 p-3 sm:p-6 border border-amber-500/30">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <span className="text-white text-sm sm:text-lg">🏆</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Top Players</h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="sm:hidden text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-3 sm:py-4 text-neutral-400 text-sm">Loading...</div>
        </div>
      );
    }

    if (leaderboard.length === 0) {
      return (
        <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 p-3 sm:p-6 border border-amber-500/30">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <span className="text-white text-sm sm:text-lg">🏆</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Top Players</h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="sm:hidden text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-3 sm:py-4 text-neutral-400 text-xs sm:text-sm">
            No players yet. Be the first to win!
          </div>
        </div>
      );
    }

    return (
      <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 p-3 sm:p-6 border border-amber-500/30">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
              <span className="text-white text-sm sm:text-lg">🏆</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Top Players</h2>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="sm:hidden text-neutral-400 hover:text-neutral-200 transition-colors"
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
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all border ${
                  isCurrentUser
                    ? "bg-orange-500/20 border-orange-500/50"
                    : "bg-neutral-900/40 border-neutral-800/50 hover:bg-neutral-800/60"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  {/* Rank */}
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shadow ${
                      isTopThree
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/50"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm sm:text-base truncate capitalize ${isCurrentUser ? "text-orange-400" : "text-white"}`}>
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-orange-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className={`font-black text-sm sm:text-base ${isCurrentUser ? "text-orange-400" : "text-white"}`}>
                      {entry.wins}W - {entry.losses}L
                    </div>
                    <div className="text-[10px] sm:text-xs text-neutral-400">
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
