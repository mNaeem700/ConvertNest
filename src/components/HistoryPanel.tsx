import React from "react";
import { HistoryItem } from "../types";
import { History, Trash2, CheckCircle2, AlertCircle, Clock, Sparkles } from "lucide-react";

interface HistoryPanelProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export default function HistoryPanel({ history, onClearHistory }: HistoryPanelProps) {
  return (
    <div className="space-y-6" id="history-panel-root">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 py-4">
        <h2 className="font-sans font-extrabold text-3xl text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <History className="h-7 w-7 text-indigo-500 animate-pulse-slow" />
          My Conversion History
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Locally persisted registry of your recent conversions. This data never leaves your browser cache.
        </p>
      </div>

      {/* Main List */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Logged Conversions ({history.length})
          </span>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors"
              id="clear-history-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-100 dark:divide-slate-800/40 pr-1">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 max-w-xs sm:max-w-md truncate">
                      {item.name}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                      {item.sourceFormat}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">
                      {item.targetFormat}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {item.timestamp}
                    </span>
                    <span>•</span>
                    <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                    {item.isAiPowered && (
                      <>
                        <span>•</span>
                        <span className="text-purple-500 font-semibold flex items-center">
                          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                          AI-Enhanced
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  {item.status === "completed" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Converted
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-10">
              <History className="h-10 w-10 text-slate-400 animate-pulse-slow" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your conversion queue log is empty.</p>
              <p className="text-[10px] text-slate-400">Go to the Converter tab to start transforming your documents!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
