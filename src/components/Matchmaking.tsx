// components/Matchmaking.tsx - Find match screen

import { useState } from "react";

interface MatchmakingProps {
  username: string;
  onFindMatch: () => void;
}

export default function Matchmaking({ username, onFindMatch }: MatchmakingProps) {
  const [isSearching, setIsSearching] = useState(false);

  const handleFindMatch = () => {
    setIsSearching(true);
    onFindMatch();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 w-full max-w-lg">
        {!isSearching ? (
          <>
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <span className="text-3xl font-black text-white">{username.charAt(0).toUpperCase()}</span>
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-2">
                Welcome, {username}!
              </h1>
              <p className="text-gray-600 text-lg">Ready to dominate the board?</p>
            </div>

            {/* Quick Match Button */}
            <button
              onClick={handleFindMatch}
              className="w-full bg-indigo-600 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] mb-6"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xl">Quick Match</span>
              </div>
            </button>

            {/* Game Info Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-linear-to-br from-indigo-50 to-indigo-100 p-4 rounded-2xl text-center border border-indigo-200">
                <div className="text-3xl font-black text-indigo-600 mb-1">2</div>
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Players</div>
              </div>
              <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-2xl text-center border border-purple-200">
                <div className="text-3xl font-black text-purple-600 mb-1">3×3</div>
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Grid</div>
              </div>
              <div className="bg-linear-to-br from-pink-50 to-pink-100 p-4 rounded-2xl text-center border border-pink-200">
                <div className="text-3xl font-black text-pink-600 mb-1">∞</div>
                <div className="text-xs font-semibold text-pink-600 uppercase tracking-wide">Rounds</div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                  <div className="w-24 h-24 border-8 border-indigo-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-24 h-24 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>

              {/* Text */}
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-3">
                Finding Opponent
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Searching for a worthy challenger...
              </p>

              {/* Animated Dots */}
              <div className="flex justify-center gap-2 mb-8">
                <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-4 h-4 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>

              {/* Tip */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <p className="text-sm text-indigo-700 font-medium">
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
