import React, { useState, useRef } from "react";
import { Code, Trash2, Copy, FileText, CheckCircle2, AlertCircle, FileCode, Play, Sparkles, Upload, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import * as yaml from "js-yaml";
import * as XLSX from "xlsx";
import { marked } from "marked";

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

    // Helper for direct client-side execution (instant & Netlify/static hosting compatible)
    const performClientSideToolbox = (): { success: boolean; result?: string; valid?: boolean; message?: string } => {
      const l = language.toLowerCase();
      const a = action.toLowerCase();
      const t = targetLang.toLowerCase();

      // 1. Syntax Validation
      if (a === "validate") {
        if (l === "json") {
          try {
            JSON.parse(code);
            return { success: true, valid: true, message: "Valid JSON format!" };
          } catch (e: any) {
            return { success: true, valid: false, message: e.message };
          }
        }
        if (l === "yaml" || l === "yml") {
          try {
            yaml.load(code);
            return { success: true, valid: true, message: "Valid YAML format!" };
          } catch (e: any) {
            return { success: true, valid: false, message: e.message };
          }
        }
        if (l === "xml") {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, "application/xml");
            const errorNode = doc.querySelector("parsererror");
            if (errorNode) {
              return { success: true, valid: false, message: errorNode.textContent || "XML parser error" };
            }
            return { success: true, valid: true, message: "Valid XML format!" };
          } catch (e: any) {
            return { success: true, valid: false, message: e.message };
          }
        }
        if (l === "csv") {
          try {
            const lines = code.trim().split("\n");
            if (lines.length === 0) return { success: true, valid: true, message: "Empty CSV content" };
            const firstColCount = lines[0].split(",").length;
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim() && lines[i].split(",").length !== firstColCount) {
                return { success: true, valid: false, message: `Row ${i + 1} has mismatched column count (Expected ${firstColCount}, got ${lines[i].split(",").length})` };
              }
            }
            return { success: true, valid: true, message: "Valid structured CSV format!" };
          } catch (e: any) {
            return { success: true, valid: false, message: e.message };
          }
        }
      }

      // 2. Beautify / Format Action
      if (a === "beautify") {
        if (l === "json") {
          try {
            const parsed = JSON.parse(code);
            return { success: true, result: JSON.stringify(parsed, null, 2) };
          } catch (e: any) {
            return { success: false, message: "Invalid JSON: " + e.message };
          }
        }
        if (l === "yaml" || l === "yml") {
          try {
            const parsed = yaml.load(code);
            return { success: true, result: yaml.dump(parsed) };
          } catch (e: any) {
            return { success: false, message: "Invalid YAML: " + e.message };
          }
        }
        if (l === "xml") {
          try {
            let formatted = "";
            const reg = /(>)(<)(\/*)/g;
            let xml = code.replace(reg, '$1\r\n$2$3');
            let pad = 0;
            xml.split('\r\n').forEach((node) => {
              let indent = 0;
              if (node.match( /.+<\/\w[^>]*>$/ )) {
                indent = 0;
              } else if (node.match( /^<\/\w/ )) {
                if (pad !== 0) pad -= 1;
              } else if (node.match( /^<\w[^>]*[^\/]>$/ )) {
                indent = 1;
              } else {
                indent = 0;
              }
              let padding = "";
              for (let i = 0; i < pad; i++) padding += "  ";
              formatted += padding + node + "\r\n";
              pad += indent;
            });
            return { success: true, result: formatted.trim() };
          } catch (e: any) {
            return { success: false, message: e.message };
          }
        }
        if (l === "markdown") {
          return { success: true, result: code.trim() };
        }
      }

      // 3. Minify Action
      if (a === "minify") {
        if (l === "json") {
          try {
            const parsed = JSON.parse(code);
            return { success: true, result: JSON.stringify(parsed) };
          } catch (e: any) {
            return { success: false, message: "Invalid JSON: " + e.message };
          }
        }
        if (l === "yaml" || l === "yml") {
          try {
            const parsed = yaml.load(code);
            return { success: true, result: JSON.stringify(parsed) }; // valid minified YAML
          } catch (e: any) {
            return { success: false, message: "Invalid YAML: " + e.message };
          }
        }
        if (l === "xml") {
          try {
            const minified = code.replace(/>\s+</g, '><').trim();
            return { success: true, result: minified };
          } catch (e: any) {
            return { success: false, message: e.message };
          }
        }
      }

      // 4. Translate / Convert Code
      if (a === "convert") {
        try {
          let parsed: any = null;

          if (l === "json") {
            parsed = JSON.parse(code);
          } else if (l === "yaml" || l === "yml") {
            parsed = yaml.load(code);
          } else if (l === "csv") {
            const workbook = XLSX.read(code, { type: "string" });
            parsed = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          } else if (l === "markdown") {
            if (t === "html") {
              const html = marked.parse(code);
              return { success: true, result: html as string };
            } else if (t === "txt") {
              return { success: true, result: code };
            }
          } else if (l === "xml") {
            const parser = new DOMParser();
            const doc = parser.parseFromString(code, "application/xml");
            
            const xmlToJson = (xml: Node): any => {
              let obj: any = {};
              if (xml.nodeType === 1) { // element
                if ((xml as Element).attributes.length > 0) {
                  obj["@attributes"] = {};
                  for (let j = 0; j < (xml as Element).attributes.length; j++) {
                    const attribute = (xml as Element).attributes.item(j);
                    if (attribute) obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                  }
                }
              } else if (xml.nodeType === 3) { // text
                obj = xml.nodeValue;
              }
              if (xml.hasChildNodes()) {
                for (let i = 0; i < xml.childNodes.length; i++) {
                  const item = xml.childNodes.item(i);
                  const nodeName = item.nodeName;
                  if (nodeName === "#text") {
                    const val = item.nodeValue?.trim();
                    if (val) {
                      if (xml.childNodes.length === 1) return val;
                      obj["#text"] = val;
                    }
                  } else {
                    if (obj[nodeName] === undefined) {
                      obj[nodeName] = xmlToJson(item);
                    } else {
                      if (!Array.isArray(obj[nodeName])) {
                        const old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                      }
                      obj[nodeName].push(xmlToJson(item));
                    }
                  }
                }
              }
              return obj;
            };
            parsed = xmlToJson(doc.documentElement);
          }

          if (parsed !== null) {
            if (t === "json") {
              return { success: true, result: JSON.stringify(parsed, null, 2) };
            } else if (t === "yaml") {
              return { success: true, result: yaml.dump(parsed) };
            } else if (t === "xml") {
              const buildXml = (obj: any, rootName = "root"): string => {
                let xml = `<${rootName}>`;
                for (const key in obj) {
                  if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const val = obj[key];
                    if (typeof val === "object" && val !== null) {
                      xml += buildXml(val, key);
                    } else {
                      xml += `<${key}>${val}</${key}>`;
                    }
                  }
                }
                xml += `</${rootName}>`;
                return xml;
              };
              return { success: true, result: `<?xml version="1.0" encoding="UTF-8"?>\n` + buildXml(parsed) };
            } else if (t === "csv") {
              const tempSheet = XLSX.utils.json_to_sheet(Array.isArray(parsed) ? parsed : [parsed]);
              const csv = XLSX.utils.sheet_to_csv(tempSheet);
              return { success: true, result: csv };
            } else if (t === "tsv") {
              const tempSheet = XLSX.utils.json_to_sheet(Array.isArray(parsed) ? parsed : [parsed]);
              const tsv = XLSX.utils.sheet_to_csv(tempSheet, { FS: "\t" });
              return { success: true, result: tsv };
            }
          }
        } catch (e: any) {
          return { success: false, message: e.message };
        }
      }

      return { success: false };
    };

    const clientResult = performClientSideToolbox();
    if (clientResult.success) {
      if (action === "validate") {
        setValidationResult({
          valid: !!clientResult.valid,
          message: clientResult.message || "",
        });
        if (clientResult.valid) {
          confetti({
            particleCount: 20,
            spread: 30,
            origin: { y: 0.8 }
          });
        }
      } else {
        setOutput(clientResult.result || "");
      }
      setIsLoading(false);
      return;
    } else if (clientResult.message) {
      // Client ran but failed with custom parse message
      if (action === "validate") {
        setValidationResult({
          valid: false,
          message: clientResult.message,
        });
      } else {
        setOutput(`Error: ${clientResult.message}`);
      }
      setIsLoading(false);
      return;
    }

    // 5. Full-stack Server route fallback (for complex AI-driven actions)
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
      
      let userFriendlyError = error.message || "An error occurred while processing the request.";
      if (error instanceof TypeError || error.message?.includes("Failed to fetch") || error.message?.includes("404")) {
        userFriendlyError = `AI-powered processing requires backend APIs. Since you are running on Netlify, please deploy in our full-stack container environment to unlock AI formatting features!`;
      }

      if (action === "validate") {
        setValidationResult({ valid: false, message: userFriendlyError });
      } else {
        setOutput(`Error: ${userFriendlyError}`);
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
