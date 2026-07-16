import React, { useState } from "react";
import { AppTab, SeoLandingPage, BlogArticle, FaqItem } from "../types";
import { 
  POPULAR_CONVERSIONS, generateSeoPage, generateFaqList, generateBlogArticles, getFormatLabel 
} from "../data/seoContent";
import { 
  ArrowRight, Check, HelpCircle, Calendar, Clock, BookOpen, FileText, Globe, 
  Mail, MessageSquare, ShieldAlert, FileWarning, Compass, ChevronRight, RefreshCw, Send, CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

interface SeoViewsProps {
  currentSlug: string | null;
  setCurrentSlug: (slug: string | null) => void;
  setActiveTab: (tab: AppTab) => void;
}

export default function SeoViews({ currentSlug, setCurrentSlug, setActiveTab }: SeoViewsProps) {
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const articles = generateBlogArticles();

  // Handle dynamic Contact Submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMessage) {
      setContactSubmitted(true);
      confetti({
        particleCount: 40,
        spread: 30,
        origin: { y: 0.8 }
      });
      // reset form
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }
  };

  // 1. Render Specific Landing Page
  if (currentSlug) {
    const parts = currentSlug.split("-to-");
    const source = parts[0] || "pdf";
    const target = parts[1] || "docx";
    const seoPage = generateSeoPage(source, target);
    const faqs = generateFaqList(source, target);

    return (
      <div className="space-y-12 animate-fade-in" id="seo-landing-view">
        
        {/* Back Link */}
        <button
          onClick={() => setCurrentSlug(null)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          id="back-to-seo-directory-btn"
        >
          <span>← Back to Supported Conversions Directory</span>
        </button>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15 uppercase tracking-widest animate-pulse-slow">
            Free Online File Converter
          </span>
          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight">
            {seoPage.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-medium leading-relaxed max-w-3xl mx-auto">
            {seoPage.tagline}
          </p>
          <div className="pt-4">
            <button
              onClick={() => {
                setActiveTab("converter");
                setCurrentSlug(null);
              }}
              className="px-6 py-3.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02] flex items-center space-x-2 mx-auto transition-transform"
              id="activate-tool-btn"
            >
              <span>Launch Conversions Tool</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Content Section & Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {/* About */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center">
              <Compass className="h-5 w-5 mr-2 text-indigo-500" />
              About {source.toUpperCase()} to {target.toUpperCase()} conversion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {seoPage.aboutText}
            </p>
            <div className="space-y-2.5 pt-2">
              {seoPage.benefits.map((b, i) => (
                <div key={i} className="flex items-start text-xs text-slate-600 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to Steps */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-cyan-500 animate-spin-slow" />
              Step-by-step conversion instructions
            </h3>
            <div className="space-y-4">
              {seoPage.howToSteps.map((step, i) => (
                <div key={i} className="flex space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-sans font-bold text-2xl text-slate-900 dark:text-white flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-purple-500" />
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{faq.question}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // 2. Render Blog Post Detail
  if (activeBlogSlug) {
    const art = articles.find(a => a.slug === activeBlogSlug);
    if (art) {
      return (
        <div className="space-y-8 max-w-4xl mx-auto animate-fade-in" id="blog-post-view">
          <button
            onClick={() => setActiveBlogSlug(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>← Back to Articles Directory</span>
          </button>

          <article className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="bg-indigo-500/10 text-indigo-500 px-2.5 py-0.5 rounded-full font-semibold">{art.category}</span>
              <span>•</span>
              <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" />{art.date}</span>
              <span>•</span>
              <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" />{art.readTime}</span>
            </div>

            <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
              {art.title}
            </h1>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed font-sans max-w-none">
              {art.content.split("\n\n").map((para, i) => {
                if (para.startsWith("###")) {
                  return <h3 key={i} className="font-sans font-bold text-lg text-slate-900 dark:text-white pt-4">{para.replace("###", "").trim()}</h3>;
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
          </article>
        </div>
      );
    }
  }

  // 3. Main SEO Directory Directory Dashboard
  return (
    <div className="space-y-12 animate-fade-in" id="seo-dashboard-directory">
      
      {/* Directory Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-3 py-4">
        <h2 className="font-sans font-extrabold text-3xl text-slate-900 dark:text-white">Supported Format Paths</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Select any verified format pairing pathway below to access specialized guides, step-by-step conversion tools, and target specifications.
        </p>
      </div>

      {/* Grid of 100+ landing pages */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-indigo-500 animate-pulse-slow" />
          Conversion Pathway SEO Directory
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {POPULAR_CONVERSIONS.map((pair, index) => {
            const slug = `${pair.s}-to-${pair.t}`;
            return (
              <button
                key={index}
                onClick={() => setCurrentSlug(slug)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400/30 hover:bg-indigo-500/5 group text-left transition-all duration-200"
              >
                <div className="truncate">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate uppercase">
                    {pair.s} → {pair.t}
                  </span>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">Free Converter</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Programmatic Blog Directory */}
      <div className="space-y-6">
        <h3 className="font-sans font-bold text-2xl text-slate-900 dark:text-white flex items-center">
          <BookOpen className="h-5.5 w-5.5 mr-2 text-cyan-500" />
          Technical Conversion Resource Center
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div 
              key={art.slug} 
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow duration-200"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">
                  {art.category}
                </span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors line-clamp-2">
                  {art.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{art.date}</span>
                <button
                  onClick={() => setActiveBlogSlug(art.slug)}
                  className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline inline-flex items-center"
                >
                  <span>Read Article</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Static Info Page Forms (Contact & About summary) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-6">
        {/* Contact Us */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-purple-500" />
              Contact ConvertNest Support
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Have inquiries, feedback, or custom business format conversion requests? Submit a direct ping through our encrypted browser portal.
            </p>
            {contactSubmitted ? (
              <div className="p-4 bg-emerald-500/15 rounded-2xl border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2 animate-bounce-slow">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xs font-bold">Inquiry dispatched! We will review instantly.</span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <textarea
                  required
                  placeholder="Inquiry message..."
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1 hover:scale-102 transition-transform shadow-md shadow-indigo-500/10"
                >
                  <Send className="h-3 w-3" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Brand Mission & Details */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-indigo-500" />
              Empowering Seamless File Interchange
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ConvertNest was established by senior architects and engineers to eradicate payment hurdles for basic file interoperations. 
              Our utility employs pure JavaScript compilation algorithms coupled with leading context servers to execute heavy transformations securely in memory.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-950/25 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Operations</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">Unlimited</p>
              </div>
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-950/25 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pricing Model</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">Free Forever</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
