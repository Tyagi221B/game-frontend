// components/ConnectionStatus.tsx - Connection status indicator

import type { ConnectionStatus } from "../types/nakama";

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          color: "bg-green-500",
          text: "Connected",
          pulse: false,
        };
      case "connecting":
        return {
          color: "bg-yellow-500",
          text: "Connecting...",
          pulse: true,
        };
      case "reconnecting":
        return {
          color: "bg-yellow-500",
          text: "Reconnecting...",
          pulse: true,
        };
      case "disconnected":
        return {
          color: "bg-red-500",
          text: "Disconnected",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed top-4 left-4 z-50 group">
      {/* Status Dot */}
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full ${config.color} ${
            config.pulse ? "animate-pulse" : ""
          } shadow-lg`}
        ></div>

        {/* Tooltip on Hover */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block">
          <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-xl shadow-orange-500/20 border border-neutral-800 whitespace-nowrap">
            {config.text}
          </div>
        </div>
      </div>
    </div>
  );
}
