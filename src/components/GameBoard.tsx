// components/GameBoard.tsx - 3x3 Tic-Tac-Toe grid

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Render a single cell - simple, no borders
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
          w-full h-full bg-black
          flex items-center justify-center text-[6rem] sm:text-[8rem] md:text-[10rem] font-black
          transition-all duration-200
          ${canClick ? "hover:bg-neutral-900 cursor-pointer active:scale-95" : "cursor-default"}
        `}
      >
        {value === "X" && (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]"
          >
            X
          </motion.span>
        )}
        {value === "O" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 250 }}
            className="text-blue-500 drop-shadow-[0_0_10px_rgba(255,138,0,0.4)]"
          >
            O
          </motion.span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-2xl mx-auto">
      {/* Players Info Bar */}
      <div className="mb-4 md:mb-8 bg-black/60 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl shadow-orange-500/20 p-3 md:p-6 border border-orange-500/20">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* You */}
          <div className={`flex items-center gap-2 md:gap-3 flex-1 transition-all duration-300 ${isMyTurn ? 'scale-105' : 'opacity-70'}`}>
            <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl shadow-lg ${mySymbol === "X" ? "bg-[#E50914]/20 border-2 border-[#E50914] text-[#E50914] shadow-[#E50914]/50" : "bg-[#0080FF]/20 border-2 border-[#0080FF] text-[#0080FF] shadow-[#0080FF]/50"}`}>
              {mySymbol}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                <div className="text-[10px] md:text-sm font-semibold text-neutral-400 uppercase tracking-wide">You</div>
                {isMyTurn && gameActive && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/50">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-400">YOUR TURN</span>
                  </div>
                )}
              </div>
              <div className="text-sm md:text-xl font-black text-white truncate mb-0.5 md:mb-1 capitalize">{gameState.players[currentUserId]?.username}</div>
              {isMyTurn && gameActive && (
                <div className={`inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-md transition-all duration-300 ${
                  timeRemaining <= 10
                    ? 'bg-red-500/20 border border-red-500/50 animate-pulse'
                    : 'bg-blue-500/20 border border-blue-500/50'
                }`}>
                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-black text-[10px] md:text-xs ${
                    timeRemaining <= 10 ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {timeRemaining}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="px-1 md:px-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center backdrop-blur-sm">
              <span className="text-sm md:text-lg font-black text-orange-400">VS</span>
            </div>
          </div>

          {/* Opponent */}
          <div className={`flex items-center gap-2 md:gap-3 flex-1 justify-end transition-all duration-300 ${!isMyTurn ? 'scale-105' : 'opacity-70'}`}>
            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center justify-end gap-1 md:gap-2 mb-0.5 md:mb-1">
                <div className="text-[10px] md:text-sm font-semibold text-neutral-400 uppercase tracking-wide">Opponent</div>
                {!isMyTurn && gameActive && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/50">
                    <span className="text-[10px] font-bold text-amber-400">THINKING</span>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div className="text-sm md:text-xl font-black text-white truncate mb-0.5 md:mb-1 capitalize">{opponent?.username || "Waiting..."}</div>
              {!isMyTurn && gameActive && (
                <div className={`inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-md transition-all duration-300 ${
                  timeRemaining <= 10
                    ? 'bg-red-500/20 border border-red-500/50 animate-pulse'
                    : 'bg-blue-500/20 border border-blue-500/50'
                }`}>
                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-black text-[10px] md:text-xs ${
                    timeRemaining <= 10 ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {timeRemaining}s
                  </span>
                </div>
              )}
            </div>
            <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl shadow-lg ${opponent?.symbol === "X" ? "bg-[#E50914]/20 border-2 border-[#E50914] text-[#E50914] shadow-[#E50914]/50" : opponent?.symbol === "O" ? "bg-[#0080FF]/20 border-2 border-[#0080FF] text-[#0080FF] shadow-[#0080FF]/50" : "bg-neutral-800 border-2 border-neutral-700 text-neutral-500"}`}>
              {opponent?.symbol || "?"}
            </div>
          </div>
        </div>
      </div>

      {/* 3x3 Grid - Classic Tic-Tac-Toe Board */}
      <div className={`relative w-full aspect-square max-w-xs sm:max-w-sm md:max-w-md mx-auto p-4 sm:p-6 md:p-8 transition-all duration-300 bg-black rounded-4xl ${!isMyTurn && gameActive ? 'opacity-60' : 'opacity-100'}`}>
        {/* The Grid */}
        <div className="w-full h-full grid grid-cols-3 bg-black">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => renderCell(index))}
        </div>

        {/* 4 White Lines Overlaid with Orange Glow */}
        {/* Vertical Line 1 - at 33.33% */}
        <div className="absolute top-4 bottom-4 sm:top-6 sm:bottom-6 md:top-8 md:bottom-8 left-[33.33%] w-0.75 bg-white pointer-events-none shadow-[0_0_10px_rgba(255,138,0,0.4)]"></div>

        {/* Vertical Line 2 - at 66.66% */}
        <div className="absolute top-4 bottom-4 sm:top-6 sm:bottom-6 md:top-8 md:bottom-8 left-[66.66%] w-0.75 bg-white pointer-events-none shadow-[0_0_10px_rgba(255,138,0,0.4)]"></div>

        {/* Horizontal Line 1 - at 33.33% */}
        <div className="absolute left-4 right-4 sm:left-6 sm:right-6 md:left-8 md:right-8 top-[33.33%] h-0.75 bg-white pointer-events-none shadow-[0_0_10px_rgba(255,138,0,0.4)]"></div>

        {/* Horizontal Line 2 - at 66.66% */}
        <div className="absolute left-4 right-4 sm:left-6 sm:right-6 md:left-8 md:right-8 top-[66.66%] h-0.75 bg-white pointer-events-none shadow-[0_0_10px_rgba(255,138,0,0.4)]"></div>
      </div>

      {/* Turn Indicator */}
      <div className="mt-8 text-center">
        <AnimatePresence mode="wait">
          {gameActive && (
            <motion.div
              key={isMyTurn ? "my-turn" : "opponent-turn"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/20 bg-black/60 backdrop-blur-xl border border-orange-500/20"
            >
              <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
              <span className="text-lg font-bold text-white">
                {isMyTurn ? `Your Turn - Place your ${mySymbol}` : `Waiting for opponent...`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
