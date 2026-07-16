import React, { useState, useRef } from "react";
import { FolderOpen, Archive, Download, Trash2, Plus, Sparkles, FolderUp, CheckCircle, FileText, FileImage } from "lucide-react";
import JSZip from "jszip";
import confetti from "canvas-confetti";
import { getFormatIcon } from "./ConversionTool";

interface ZipFileItem {
  name: string;
  size: number;
  contentBlob: Blob;
  dir: boolean;
}

export default function ArchiveManager() {
  const [zipName, setZipName] = useState("convertnest-archive");
  const [packFiles, setPackFiles] = useState<File[]>([]);
  const [extractedFiles, setExtractedFiles] = useState<ZipFileItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPacking, setIsPacking] = useState(false);
  const [activeMode, setActiveMode] = useState<"pack" | "extract">("extract");

  const packInputRef = useRef<HTMLInputElement>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);

  // Extract ZIP archive client-side
  const handleZipExtraction = async (file: File) => {
    setIsExtracting(true);
    setExtractedFiles([]);
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const extractedList: ZipFileItem[] = [];

      // Iterate through files
      const promises: Promise<void>[] = [];
      loadedZip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async("blob").then((blob) => {
            extractedList.push({
              name: relativePath,
              size: blob.size,
              contentBlob: blob,
              dir: false,
            });
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
      setExtractedFiles(extractedList);
      
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.8 }
      });
    } catch (e) {
      console.error("ZIP extraction failed:", e);
      alert("Failed to parse ZIP archive. Make sure it is a valid compressed file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleZipExtraction(e.target.files[0]);
    }
  };

  // Add files to pack queue
  const handlePackFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const list: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        list.push(e.target.files[i]);
      }
      setPackFiles((prev) => [...prev, ...list]);
    }
  };

  const removePackFile = (index: number) => {
    setPackFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Compile files into ZIP in browser and download
  const packToZip = async () => {
    if (packFiles.length === 0) return;
    setIsPacking(true);
    try {
      const zip = new JSZip();
      packFiles.forEach((file) => {
        zip.file(file.name, file);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `${zipName.trim() || "convertnest-archive"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.error("ZIP creation failed:", e);
    } finally {
      setIsPacking(false);
    }
  };

  const downloadExtractedFile = (item: ZipFileItem) => {
    const url = URL.createObjectURL(item.contentBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.name.split("/").pop() || "extracted_file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="archive-manager-root">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 py-4">
        <h2 className="font-sans font-extrabold text-3xl text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Archive className="h-7 w-7 text-indigo-500 animate-pulse-slow" />
          ZIP & Archive Manager
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Extract files instantly from compressed ZIP folders or bundle files together locally in your browser.
        </p>
      </div>

      {/* Mode Switcher Tab */}
      <div className="flex justify-center">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl inline-flex">
          <button
            onClick={() => setActiveMode("extract")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeMode === "extract"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Extract ZIP Archive
          </button>
          <button
            onClick={() => setActiveMode("pack")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeMode === "pack"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Create ZIP Archive
          </button>
        </div>
      </div>

      {/* Mode Panels */}
      {activeMode === "extract" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Uploader Left */}
          <div className="lg:col-span-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-200">Select ZIP Archive</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drop or select a .zip compressed folder. JSZip parses and decompresses structures in memory without sending bytes to servers.
            </p>
            
            <input
              type="file"
              ref={extractInputRef}
              onChange={handleExtractChange}
              accept=".zip"
              className="hidden"
            />
            <button
              onClick={() => extractInputRef.current?.click()}
              className="w-full py-4 bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-sm hover:scale-102 shadow-lg shadow-indigo-500/15 flex items-center justify-center space-x-2 transition-transform duration-150"
            >
              <FolderOpen className="h-4.5 w-4.5" />
              <span>{isExtracting ? "Parsing ZIP..." : "Open ZIP File"}</span>
            </button>
          </div>

          {/* Listing Right */}
          <div className="lg:col-span-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[320px] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Extracted Files Listing ({extractedFiles.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-1 mt-2">
              {extractedFiles.length > 0 ? (
                extractedFiles.map((item, index) => {
                  const nameParts = item.name.split(".");
                  const ext = nameParts.pop() || "txt";
                  const ExtIcon = getFormatIcon(ext);
                  return (
                    <div key={index} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                          <ExtIcon className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{(item.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadExtractedFile(item)}
                        className="p-2 text-white bg-emerald-500 hover:scale-105 rounded-xl shadow-sm transition-transform"
                        title="Download extracted file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-10">
                  <FolderUp className="h-10 w-10 text-slate-400 animate-pulse-slow" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open a ZIP folder on the left to see contents</p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* Settings Left */}
          <div className="lg:col-span-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-200">ZIP Packaging Settings</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ZIP File Name</label>
              <input
                type="text"
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                placeholder="Name your archive..."
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Drop files inside the browser pipeline, compile as compressed `.zip` package immediately.
            </p>

            <button
              onClick={packToZip}
              disabled={packFiles.length === 0 || isPacking}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-sm hover:scale-102 disabled:opacity-50 shadow-lg shadow-indigo-500/15 flex items-center justify-center space-x-2 transition-transform duration-150"
            >
              <CheckCircle className="h-4.5 w-4.5" />
              <span>{isPacking ? "Compiling..." : "Build & Download ZIP"}</span>
            </button>
          </div>

          {/* Files List Right */}
          <div className="lg:col-span-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[320px] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Files to Package ({packFiles.length})
              </span>
              <input
                type="file"
                ref={packInputRef}
                onChange={handlePackFilesAdd}
                multiple
                className="hidden"
              />
              <button
                onClick={() => packInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add Files</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-1 mt-2">
              {packFiles.length > 0 ? (
                packFiles.map((file, idx) => {
                  const ext = file.name.split(".").pop() || "txt";
                  const ExtIcon = getFormatIcon(ext);
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 bg-indigo-500/5 text-indigo-500 rounded-xl">
                          <ExtIcon className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removePackFile(idx)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-10">
                  <Archive className="h-10 w-10 text-slate-400 animate-pulse-slow" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Click "Add Files" above to bundle files into a ZIP package</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
