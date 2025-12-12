// components/GameBoard.tsx - 3x3 Tic-Tac-Toe grid

import { useState, useEffect } from "react";
import type { GameState } from "../types/game";

interface GameBoardProps {
  gameState: GameState;
  currentUserId: string;
  onCellClick: (position: number) => void;
}

export default function GameBoard({
  gameState,
  currentUserId,
  onCellClick,
}: GameBoardProps) {
  // Check if it's current player's turn
  const isMyTurn = gameState.currentTurn === currentUserId;
  const gameActive = gameState.status === "active";

  // Turn timer countdown - calculate remaining time
  const [timeRemaining, setTimeRemaining] = useState<number>(30);

  useEffect(() => {
    if (!gameActive || !gameState.turnStartTimestamp) {
      return;
    }

    // Update countdown every 100ms for smooth animation
    const interval = setInterval(() => {
      if (gameState.turnStartTimestamp === null) return;
      const elapsed = Math.floor((Date.now() - gameState.turnStartTimestamp) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [gameActive, gameState.turnStartTimestamp]);

  // Get current player's symbol and opponent
  const mySymbol = gameState.players[currentUserId]?.symbol;
  const playerIds = Object.keys(gameState.players);
  const opponentId = playerIds.find(id => id !== currentUserId);
  const opponent = opponentId ? gameState.players[opponentId] : null;

  // Render a single cell
  const renderCell = (index: number) => {
    const value = gameState.board[index];
    const isEmpty = value === null;
    const canClick = gameActive && isMyTurn && isEmpty;

    return (
      <button
        key={index}
        onClick={() => canClick && onCellClick(index)}
        disabled={!canClick}
        className={`
          w-full aspect-square bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg
          flex items-center justify-center text-7xl font-black
          transition-all duration-200 border-4
          ${canClick ? "hover:bg-indigo-50 hover:shadow-2xl cursor-pointer hover:scale-105 hover:-translate-y-1 border-indigo-200 hover:border-indigo-400" : "cursor-not-allowed border-gray-200"}
          ${!isEmpty ? "bg-linear-to-br from-white to-gray-50" : ""}
        `}
      >
        {value === "X" && (
          <span className="text-transparent bg-clip-text bg-linear-to-br from-indigo-600 to-purple-600 drop-shadow-lg">X</span>
        )}
        {value === "O" && (
          <span className="text-transparent bg-clip-text bg-linear-to-br from-pink-600 to-rose-600 drop-shadow-lg">O</span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Players Info Bar */}
      <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white/50">
        <div className="flex items-center justify-between gap-4">
          {/* You */}
          <div className={`flex items-center gap-3 flex-1 transition-all duration-300 ${isMyTurn ? 'scale-105' : 'opacity-70'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${mySymbol === "X" ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white" : "bg-linear-to-br from-pink-500 to-rose-600 text-white"}`}>
              {mySymbol}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">You</div>
              <div className="text-xl font-black text-gray-800 truncate">{gameState.players[currentUserId]?.username}</div>
            </div>
            {isMyTurn && gameActive && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-green-700">YOUR TURN</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                  timeRemaining <= 10
                    ? 'bg-red-100 border border-red-300 animate-pulse'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-black text-sm ${
                    timeRemaining <= 10 ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {timeRemaining}s
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="px-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-lg font-black text-gray-400">VS</span>
            </div>
          </div>

          {/* Opponent */}
          <div className={`flex items-center gap-3 flex-1 justify-end transition-all duration-300 ${!isMyTurn ? 'scale-105' : 'opacity-70'}`}>
            {!isMyTurn && gameActive && (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                  timeRemaining <= 10
                    ? 'bg-red-100 border border-red-300 animate-pulse'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-black text-sm ${
                    timeRemaining <= 10 ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {timeRemaining}s
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
                  <span className="text-xs font-bold text-amber-700">THINKING...</span>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            <div className="flex-1 text-right">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Opponent</div>
              <div className="text-xl font-black text-gray-800 truncate">{opponent?.username || "Waiting..."}</div>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${opponent?.symbol === "X" ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white" : "bg-linear-to-br from-pink-500 to-rose-600 text-white"}`}>
              {opponent?.symbol || "?"}
            </div>
          </div>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="relative">
        <div className={`grid grid-cols-3 gap-4 p-8 bg-linear-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl shadow-2xl border-4 border-white/50 transition-all duration-300 ${!isMyTurn && gameActive ? 'opacity-60' : 'opacity-100'}`}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => renderCell(index))}
        </div>

        {/* Disabled Overlay when not your turn */}
        {!isMyTurn && gameActive && (
          <div className="absolute inset-0 bg-gray-900/10 rounded-3xl flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border-2 border-gray-200">
              <p className="text-gray-700 font-bold text-lg">Opponent's Turn</p>
            </div>
          </div>
        )}
      </div>

      {/* Turn Indicator */}
      <div className="mt-8 text-center">
        {gameActive && (
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm border-2 border-white/50">
            <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className="text-lg font-bold text-gray-700">
              {isMyTurn ? `Your Turn - Place your ${mySymbol}` : `Waiting for opponent...`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
