import React, { useState, useRef } from "react";
import { Code, Trash2, Copy, FileText, CheckCircle2, AlertCircle, FileCode, Play, Sparkles, Upload, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

export default function CodeToolbox() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("json");
  const [action, setAction] = useState("beautify");
  const [targetLang, setTargetLang] = useState("yaml");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      
      const langMap: Record<string, string> = {
        json: "json",
        xml: "xml",
        yaml: "yaml",
        yml: "yaml",
        sql: "sql",
        csv: "csv",
        md: "markdown",
        markdown: "markdown"
      };

      if (langMap[ext]) {
        setLanguage(langMap[ext]);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string || "");
        setOutput("");
        setValidationResult(null);
      };
      reader.readAsText(file);
    }
  };

  const executeAction = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setValidationResult(null);
    setOutput("");

    try {
      // If action is conversion
      if (action === "convert") {
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `input_code.${language}`,
            fileContent: window.btoa(unescape(encodeURIComponent(code))),
            sourceFormat: language,
            targetFormat: targetLang,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Conversion failed");
        }

        const data = await response.json();
        const decodedContent = decodeURIComponent(escape(window.atob(data.content)));
        setOutput(decodedContent);
        
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.8 }
        });
      } else {
        // Validation, Beautification, Minification
        const response = await fetch("/api/toolbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language, action }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Toolbox action failed");
        }

        const data = await response.json();
        
        if (action === "validate") {
          setValidationResult({
            valid: data.valid,
            message: data.message,
          });
          if (data.valid) {
            confetti({
              particleCount: 20,
              spread: 30,
              origin: { y: 0.8 }
            });
          }
        } else {
          setOutput(data.result || "");
        }
      }
    } catch (error: any) {
      console.error("Code toolbox execution failed:", error);
      if (action === "validate") {
        setValidationResult({ valid: false, message: error.message || "An error occurred during syntax validation" });
      } else {
        setOutput(`Error: ${error.message || "An error occurred while processing the request."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setCode("");
    setOutput("");
    setValidationResult(null);
  };

  return (
    <div className="space-y-6" id="code-toolbox-root">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 py-4">
        <h2 className="font-sans font-extrabold text-3xl text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Code className="h-7 w-7 text-indigo-500" />
          Code & Document Toolbox
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Format, minify, convert, or validate structured configuration and data files instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Editor Settings Panel */}
        <div className="lg:col-span-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Source Language */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setValidationResult(null);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                id="toolbox-lang-select"
              >
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="yaml">YAML</option>
                <option value="csv">CSV</option>
                <option value="sql">SQL</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>

            {/* Action */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Action:</span>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setValidationResult(null);
                  setOutput("");
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                id="toolbox-action-select"
              >
                <option value="beautify">Format / Beautify</option>
                <option value="minify">Minify / Compress</option>
                <option value="validate">Validate Syntax</option>
                <option value="convert">Convert / Translate</option>
              </select>
            </div>

            {/* Target Language (for Conversion) */}
            {action === "convert" && (
              <div className="flex items-center space-x-2 animate-fade-in">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target:</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none animate-pulse-slow"
                  id="toolbox-target-lang-select"
                >
                  {language === "json" && (
                    <>
                      <option value="yaml">YAML</option>
                      <option value="xml">XML</option>
                      <option value="csv">CSV</option>
                    </>
                  )}
                  {language === "yaml" && (
                    <>
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                    </>
                  )}
                  {language === "xml" && (
                    <>
                      <option value="json">JSON</option>
                      <option value="yaml">YAML</option>
                    </>
                  )}
                  {language === "csv" && (
                    <>
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="tsv">TSV</option>
                      <option value="xlsx">XLSX Excel</option>
                    </>
                  )}
                  {language === "sql" && (
                    <>
                      <option value="json">JSON (Data)</option>
                      <option value="xml">XML (Data)</option>
                    </>
                  )}
                  {language === "markdown" && (
                    <>
                      <option value="html">HTML</option>
                      <option value="txt">TXT Plain</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              id="toolbox-file-upload-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="Upload file code"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import File</span>
            </button>
            <button
              onClick={clearAll}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors"
              title="Clear all text"
              id="toolbox-clear-btn"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* Input Pane */}
        <div className="lg:col-span-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center">
              <FileCode className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              Paste Input
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{language}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setValidationResult(null);
            }}
            placeholder={`Paste or type your raw ${language.toUpperCase()} code here...`}
            className="flex-1 w-full bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl text-xs font-mono text-slate-800 dark:text-emerald-400/90 border border-slate-100 dark:border-slate-800/80 outline-none resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            id="toolbox-input-textarea"
          />
        </div>

        {/* Output Pane */}
        <div className="lg:col-span-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[400px] relative">
          
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center">
              <FileText className="h-3.5 w-3.5 mr-1.5 text-cyan-500" />
              Results Output
            </span>
            <div className="flex items-center space-x-1.5">
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-2.5 py-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 rounded-lg text-[10px] font-semibold transition-colors"
                  id="toolbox-copy-btn"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? "Copied!" : "Copy Output"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 relative rounded-2xl bg-slate-950 border border-slate-900 overflow-hidden flex flex-col">
            {validationResult ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                {validationResult.valid ? (
                  <>
                    <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 shadow-lg shadow-emerald-500/5 animate-pulse-slow">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-bold text-lg font-sans">Syntactically Correct</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">{validationResult.message}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 shadow-lg shadow-rose-500/5">
                      <AlertCircle className="h-12 w-12" />
                    </div>
                    <div>
                      <h4 className="text-rose-400 font-bold text-lg font-sans">Syntax Errors Detected</h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono max-w-md bg-slate-900/50 p-3 rounded-xl border border-rose-500/20 leading-relaxed text-left">
                        {validationResult.message}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="Results of beautify, minify, and conversions will appear here..."
                className="flex-1 w-full bg-transparent p-4 text-xs font-mono text-cyan-400 outline-none resize-none"
                id="toolbox-output-textarea"
              />
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-400">Processing code toolbox...</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Action Trigger Button */}
        <div className="lg:col-span-12 flex justify-center pt-2">
          <button
            onClick={executeAction}
            disabled={isLoading || !code.trim()}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/15 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all duration-200"
            id="toolbox-submit-btn"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running Action...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span className="capitalize">Run {action === "convert" ? `Convert to ${targetLang.toUpperCase()}` : action}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
