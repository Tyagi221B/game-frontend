// components/Login.tsx - Nickname entry screen

import { useState } from "react";

interface LoginProps {
  onLogin: (nickname: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Normalize username (trim and remove extra whitespace)
    const normalizedNickname = nickname.trim().replace(/\s+/g, ' ');

    // Validation
    if (normalizedNickname.length < 2) {
      setError("Nickname must be at least 2 characters");
      return;
    }

    if (normalizedNickname.length > 20) {
      setError("Nickname must be less than 20 characters");
      return;
    }

    // Clear error and proceed
    setError("");
    onLogin(normalizedNickname);
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
        {/* Game Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-3">
            Tic-Tac-Toe
          </h1>
          <p className="text-gray-600 text-lg">Enter your nickname to start the battle!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="nickname"
              className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide"
            >
              Player Name
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-200 text-lg font-medium"
              autoFocus
            />
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2 text-black py-2 bg-amber-200 rounded-3xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Playing
            </span>
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Multiplayer
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Real-time
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Server-Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
