import React, { useState } from "react";
import { AppTab } from "../types";
import { ShieldAlert, FileWarning, Eye, Scale, HelpCircle, X, ChevronRight } from "lucide-react";

interface FooterProps {
  setActiveTab: (tab: AppTab) => void;
  setCurrentSlug: (slug: string | null) => void;
}

export default function Footer({ setActiveTab, setCurrentSlug }: FooterProps) {
  const [modalType, setModalType] = useState<"privacy" | "terms" | "disclaimer" | "about" | null>(null);

  const policySections = {
    about: {
      title: "About ConvertNest",
      content: `### Universal Free File Converter
ConvertNest was engineered by web architects committed to providing high-speed, completely unrestricted document operations. 
We support batch conversions, code formatters, and archive extractions fully client-side and via secure API endpoints.

### Why Choose ConvertNest?
- **Zero Registration Barriers**: No accounts, no password forms, no verification emails.
- **Client-Side Optimization**: Lightweight image transformations and archive compilations execute fully inside your browser environment.
- **AI-Enhanced Restructuring**: We leverage Gemini 3.5 models to cleanly format messy document structures (DOCX, PDF, RTF) that traditional offline utilities fail to map correctly.`,
    },
    privacy: {
      title: "Privacy & Data Confidentiality",
      content: `### Client-First Security
At ConvertNest, privacy is not a feature—it is our architecture.

### Storage and Deletion Policy
1. **Local Computations**: Conversions involving standard images, CSV tables, code, and ZIP archives are processed entirely within your browser's V8 engine. No file data is uploaded to our network nodes.
2. **Server Conversions**: For files requiring advanced formatting (e.g. DOCX Mammoth extraction or Gemini context-aware restructuring), files are transmitted securely over TLS. 
3. **Automated Scratchpad Wipe**: Files processed on our server exist purely in volatile RAM and are permanently purged instantly upon execution. We maintain zero database logs or file records.
4. **Third-Party API Access**: When utilizing the Google Gemini API server-side, data is processed under secure, non-training configurations. Your intellectual property is protected.`,
    },
    terms: {
      title: "Terms of Service",
      content: `### 1. Acceptance of Terms
By utilizing ConvertNest, you agree to these transparent usage terms. This is a 100% free service with no payment models.

### 2. Fair Usage Policy
- You are free to batch convert unlimited files for personal, commercial, academic, or professional purposes.
- You agree not to attempt to breach our secure API pipelines or disrupt our hosting container infrastructure.

### 3. Liability and Warranty
ConvertNest is provided "as is" without express or implied warranties. While our layout converters maintain pristine text preservation, we advise double-checking important financial and legal documents.`,
    },
    disclaimer: {
      title: "Legal Disclaimer",
      content: `### No Support for Media Conversions
Please note that ConvertNest strictly excludes audio and video conversion formats (MP3, MP4, AVI, etc.) to optimize pipeline capacity for technical documents, sheets, spreadsheets, images, fonts, and archives.

### Accuracy of Conversion
Conversion outputs are compiled using high-grade rendering libraries. ConvertNest is not liable for errors in cell mapping, column misalignment, or formatting variances.`,
    }
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md transition-colors duration-300 py-12 mt-16" id="app-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Brand Summary */}
        <div className="md:col-span-4 space-y-4">
          <span className="font-sans font-black text-lg text-slate-800 dark:text-white">ConvertNest</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Universal cloud file converter engineered for fast, secure, and unlimited format transformations. 
            All spreadsheets, image formats, files, and zip extraction are completed instantly with zero watermarks.
          </p>
          <p className="text-[10px] text-slate-400">
            © 2026 ConvertNest. Free and Open Access. All Rights Reserved.
          </p>
        </div>

        {/* Dynamic Pages Nav */}
        <div className="md:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">Policies & Terms</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => setModalType("about")} className="text-left text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">About Us</button>
            <button onClick={() => setModalType("privacy")} className="text-left text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Privacy Policy</button>
            <button onClick={() => setModalType("terms")} className="text-left text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Terms of Use</button>
            <button onClick={() => setModalType("disclaimer")} className="text-left text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Disclaimer</button>
            <button onClick={() => { setActiveTab("seo-page"); setCurrentSlug(null); }} className="text-left text-indigo-500 hover:underline font-semibold col-span-2">Browse All 100+ Formats Directory →</button>
          </div>
        </div>

        {/* Conversion Highlights */}
        <div className="md:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">Capacity Limits</span>
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <p>• Max batch size: <span className="font-bold text-slate-700 dark:text-slate-300">Unlimited Files</span></p>
            <p>• Processing speed: <span className="font-bold text-slate-700 dark:text-slate-300">Instant Execution</span></p>
            <p>• Auth verification: <span className="font-bold text-slate-700 dark:text-slate-300">No Login Required</span></p>
          </div>
        </div>

      </div>

      {/* Dynamic Privacy, Terms and About Modals */}
      {modalType && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            
            <div className="space-y-5 flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-sans font-bold text-xl text-slate-900 dark:text-white">
                  {policySections[modalType].title}
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed max-h-[45vh] overflow-y-auto pr-1">
                {policySections[modalType].content.split("\n\n").map((para, i) => {
                  if (para.startsWith("###")) {
                    return <h4 key={i} className="font-sans font-bold text-sm text-slate-900 dark:text-white pt-2">{para.replace("###", "").trim()}</h4>;
                  }
                  if (para.startsWith("1.") || para.startsWith("-")) {
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1">
                        {para.split("\n").map((li, j) => (
                          <li key={j}>{li.replace(/^[-\d.]\s*/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i}>{para}</p>;
                })}
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}
    </footer>
  );
}
