// components/Matchmaking.tsx - Find match screen

import { useState } from "react";
import type { GameMode } from "../types/game";
import Button from "./Button";

interface MatchmakingProps {
  username: string;
  onFindMatch: (mode: GameMode) => void;
  onCancelMatch: () => void;
  onLogout: () => void;
}

export default function Matchmaking({ username, onFindMatch, onCancelMatch, onLogout }: MatchmakingProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const handleFindMatch = (mode: GameMode) => {
    setSelectedMode(mode);
    setIsSearching(true);
    onFindMatch(mode);
  };

  const handleCancel = () => {
    setIsSearching(false);
    setSelectedMode(null);
    onCancelMatch();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Animated Orange/Red Glow Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-linear-to-br from-orange-500/30 via-red-500/20 to-transparent rounded-full blur-3xl animate-glow-pulse"></div>
        <div className="absolute bottom-20 right-10 w-125 h-125 bg-linear-to-tl from-red-600/30 via-orange-600/20 to-transparent rounded-full blur-3xl animate-glow-pulse-delayed"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-500/20 p-10 w-full max-w-lg border border-orange-500/20">
        {!isSearching ? (
          <>
            {/* Logout Button - Top Right */}
            <button
              onClick={onLogout}
              className="absolute top-4 right-4 text-neutral-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
              title="Logout and clear identity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Welcome Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-500 to-red-600 rounded-full mb-4 shadow-lg shadow-orange-500/50">
                <span className="text-3xl font-black text-white">{username.charAt(0).toUpperCase()}</span>
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500 mb-2">
                Welcome, <span className="capitalize">{username}</span>!
              </h1>
              <p className="text-neutral-300 text-lg mb-6">Choose your game mode</p>
            </div>

            {/* Mode Selection */}
            <div className="space-y-4 mb-6">
              {/* Classic Mode */}
              <button
                onClick={() => handleFindMatch("classic")}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/50 hover:border-blue-400 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/50 transition-colors">
                    <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-2xl font-black text-blue-300 mb-1">Classic Mode</h3>
                    <p className="text-sm text-blue-200/70">No time limit • Relaxed gameplay</p>
                  </div>
                  <div className="text-blue-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Timed Mode */}
              <button
                onClick={() => handleFindMatch("timed")}
                className="w-full bg-orange-500/20 hover:bg-orange-500/30 border-2 border-orange-500/50 hover:border-orange-400 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/50 transition-colors">
                    <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-2xl font-black text-orange-300 mb-1">Timed Mode</h3>
                    <p className="text-sm text-orange-200/70">30 seconds per turn • Fast-paced</p>
                  </div>
                  <div className="text-orange-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer Info */}
            <div className="pt-6 border-t border-orange-500/20">
              <div className="flex items-center justify-center gap-4 text-xs font-medium text-neutral-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  Server Online
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Real-time Sync
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Searching State */}
            <div className="text-center py-8">
              {/* Loading Spinner */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 border-8 border-orange-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-24 h-24 border-8 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>

              {/* Text */}
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500 mb-3">
                Finding Opponent
              </h2>
              <p className="text-neutral-300 text-lg mb-2">
                Searching for a worthy challenger...
              </p>
              <p className="text-sm text-neutral-400 mb-8">
                Mode: <span className="font-bold text-orange-400 capitalize">{selectedMode}</span>
              </p>

              {/* Animated Dots */}
              <div className="flex justify-center gap-2 mb-8">
                <div className="w-4 h-4 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-4 h-4 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>

              {/* Cancel Button */}
              <Button onClick={handleCancel} variant="secondary" className="mb-6">
                Cancel Search
              </Button>

              {/* Tip */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-sm text-orange-300 font-medium">
                  💡 Tip: Open another browser tab to test multiplayer locally!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
