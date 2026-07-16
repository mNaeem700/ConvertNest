import React, { useState, useEffect } from "react";
import { AppTab, HistoryItem } from "./types";
import Navbar from "./components/Navbar";
import ConversionTool from "./components/ConversionTool";
import CodeToolbox from "./components/CodeToolbox";
import ArchiveManager from "./components/ArchiveManager";
import HistoryPanel from "./components/HistoryPanel";
import SeoViews from "./components/SeoViews";
import Footer from "./components/Footer";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("converter");
  const [isDark, setIsDark] = useState<boolean>(true); // default to beautiful dark theme
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("convertnest_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse history logs:", e);
    }
  }, []);

  // Save history helper
  const handleAddToHistory = (newItem: HistoryItem) => {
    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 100); // keep max 100
      try {
        localStorage.setItem("convertnest_history", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed storing history log:", e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("convertnest_history");
    } catch (e) {
      console.error("Failed clearing history log:", e);
    }
  };

  // Switch tab from external views
  const handleTabSwitch = (tab: AppTab) => {
    setActiveTab(tab);
    setCurrentSlug(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSeoSlugSelect = (slug: string | null) => {
    setCurrentSlug(slug);
    setActiveTab("seo-page");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between">
        
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-600/10 blur-[120px] dark:from-indigo-950/40 dark:to-purple-950/20" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-cyan-500/10 to-indigo-500/20 blur-[120px] dark:from-cyan-950/20 dark:to-indigo-950/40" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)]" />
        </div>

        {/* Content wrap */}
        <div className="relative z-10 flex-1 flex flex-col justify-start">
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={handleTabSwitch} 
            isDark={isDark} 
            setIsDark={setIsDark} 
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            {activeTab === "converter" && (
              <div className="animate-fade-in">
                <ConversionTool onAddToHistory={handleAddToHistory} isDark={isDark} />
              </div>
            )}
            {activeTab === "toolbox" && (
              <div className="animate-fade-in">
                <CodeToolbox />
              </div>
            )}
            {activeTab === "archive" && (
              <div className="animate-fade-in">
                <ArchiveManager />
              </div>
            )}
            {activeTab === "history" && (
              <div className="animate-fade-in">
                <HistoryPanel history={history} onClearHistory={handleClearHistory} />
              </div>
            )}
            {activeTab === "seo-page" && (
              <SeoViews 
                currentSlug={currentSlug} 
                setCurrentSlug={setCurrentSlug} 
                setActiveTab={handleTabSwitch}
              />
            )}
          </main>
        </div>

        {/* Dynamic footer policies and layout mapping */}
        <Footer 
          setActiveTab={handleTabSwitch} 
          setCurrentSlug={handleSeoSlugSelect} 
        />

      </div>
    </div>
  );
}
