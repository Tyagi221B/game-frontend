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
          className="md:hidden bg-black/80 backdrop-blur-sm rounded-full shadow-xl shadow-amber-500/20 p-2 md:p-3 border-2 border-amber-500/50 hover:scale-110 transition-transform"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
            <span className="text-white text-base md:text-lg">🏆</span>
          </div>
        </button>

        {/* Desktop: Full leaderboard always visible */}
        <div className="hidden md:block">
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
        <div className="bg-black/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/20 p-3 md:p-6 border border-amber-500/30">
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <span className="text-white text-base md:text-lg">🏆</span>
              </div>
              <h2 className="text-base md:text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600">Top Players</h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="md:hidden text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-3 md:py-4 text-neutral-400 text-xs md:text-sm">Loading...</div>
        </div>
      );
    }

    if (leaderboard.length === 0) {
      return (
        <div className="bg-black/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/20 p-3 md:p-6 border border-amber-500/30">
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <span className="text-white text-base md:text-lg">🏆</span>
              </div>
              <h2 className="text-base md:text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600">Top Players</h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="md:hidden text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-3 md:py-4 text-neutral-400 text-xs md:text-sm">
            No players yet. Be the first to win!
          </div>
        </div>
      );
    }

    return (
      <div className="bg-black/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/20 p-3 md:p-6 border border-amber-500/30">
        <div className="flex items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
              <span className="text-white text-base md:text-lg">🏆</span>
            </div>
            <h2 className="text-base md:text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-600">Top Players</h2>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="md:hidden text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1.5 md:space-y-2">
          {leaderboard.slice(0, 5).map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isTopThree = index < 3;

            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl transition-all border ${
                  isCurrentUser
                    ? "bg-orange-500/20 border-orange-500/50"
                    : "bg-neutral-900/40 border-neutral-800/50 hover:bg-neutral-800/60"
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  {/* Rank */}
                  <div
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center font-black text-xs md:text-sm shadow ${
                      isTopThree
                        ? "bg-linear-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/50"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-xs md:text-base truncate capitalize ${isCurrentUser ? "text-orange-400" : "text-white"}`}>
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-1 md:ml-2 text-[9px] md:text-xs bg-orange-500 text-white px-1 md:px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className={`font-black text-xs md:text-base ${isCurrentUser ? "text-orange-400" : "text-white"}`}>
                      {entry.wins}W - {entry.losses}L
                    </div>
                    <div className="text-[9px] md:text-xs text-neutral-400">
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
