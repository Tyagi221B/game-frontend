// components/Login.tsx - Nickname entry screen

import { useState } from "react";
import Button from "./Button";

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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Animated Orange/Red Glow Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-linear-to-br from-orange-500/30 via-red-500/20 to-transparent rounded-full blur-3xl animate-glow-pulse"></div>
        <div className="absolute bottom-20 right-10 w-125 h-125 bg-linear-to-tl from-red-600/30 via-orange-600/20 to-transparent rounded-full blur-3xl animate-glow-pulse-delayed"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-500/20 p-10 w-full max-w-lg border border-orange-500/20">
        {/* Game Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-linear-to-br from-orange-500 to-red-600 p-4 rounded-2xl shadow-lg shadow-orange-500/50">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500 mb-3">
            Tic-Tac-Toe
          </h1>
          <p className="text-neutral-300 text-lg">Enter your nickname to start the battle!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="nickname"
              className="block text-neutral-200 font-semibold mb-3 text-sm uppercase tracking-wide"
            >
              Player Name
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-5 py-4 bg-black/40 border-2 border-orange-500/30 rounded-xl focus:border-orange-500 focus:bg-black/60 focus:outline-none transition-all duration-200 text-lg font-medium text-white placeholder-neutral-500"
              autoFocus
            />
            {error && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <Button type="submit" variant="primary">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Playing
            </span>
          </Button>
        </form>

        {/* Info */}
        <div className="mt-8 pt-6 border-t border-orange-500/20">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-neutral-400">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Multiplayer
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Real-time
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Server-Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
