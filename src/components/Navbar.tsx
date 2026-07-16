import React from "react";
import { AppTab } from "../types";
import { RefreshCw, Code, Archive, History, Sun, Moon, Sparkles } from "lucide-react";

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Navbar({ activeTab, setActiveTab, isDark, setIsDark }: NavbarProps) {
  const tabs = [
    { id: "converter" as AppTab, label: "Converter", icon: RefreshCw },
    { id: "toolbox" as AppTab, label: "Code Toolbox", icon: Code },
    { id: "archive" as AppTab, label: "ZIP Manager", icon: Archive },
    { id: "history" as AppTab, label: "My History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Styled with High Density Icon Wrapper */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab("converter")}
          id="navbar-logo"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <svg className="w-5 h-5 text-white animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </div>
          <div>
            <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Convert<span className="text-indigo-600 dark:text-indigo-400">Nest</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs - High Density Hover and Active states */}
        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium" id="navbar-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                id={`tab-btn-${tab.id}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-500 dark:text-indigo-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side Controls - Dynamic System Online indicator and switches */}
        <div className="flex items-center space-x-3" id="navbar-controls">
          {/* Active Status Badge from Theme */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">System Online</span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm"
            aria-label="Toggle theme"
            id="theme-toggle"
          >
            {isDark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>

          {/* Mobile Menu Actions */}
          <div className="md:hidden flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title={tab.label}
                  id={`mobile-tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
