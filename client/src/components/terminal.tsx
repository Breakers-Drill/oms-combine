import { useEffect, useRef } from "react";
import type { SystemLog } from "@/types";

interface TerminalProps {
  logs: SystemLog[];
  isLoading?: boolean;
}

export default function Terminal({ logs, isLoading }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div 
      ref={terminalRef}
      className="h-full p-4 bg-slate-900 font-mono text-sm text-green-400 overflow-auto"
    >
      {isLoading && logs.length === 0 ? (
        <div className="animate-pulse">Loading logs...</div>
      ) : (
        <>
          {logs.map((log) => (
            <div key={log.id} className="mb-2">
              <span className="text-slate-500">
                [{formatTimestamp(log.timestamp)}]
              </span>{" "}
              <span className={getLevelColor(log.level)}>
                {log.level.toUpperCase()}
              </span>{" "}
              <span className="text-green-400">{log.message}</span>
            </div>
          ))}
          <div className="animate-pulse">▋</div>
        </>
      )}
    </div>
  );
}
