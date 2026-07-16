export type AppTab = "converter" | "toolbox" | "archive" | "history" | "seo-page" | "about" | "privacy" | "terms" | "disclaimer" | "contact";

export interface FileQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  sourceFormat: string;
  targetFormat: string;
  status: "queued" | "converting" | "completed" | "failed";
  progress: number;
  resultUrl?: string;
  resultBlob?: Blob;
  resultName?: string;
  error?: string;
  isAiPowered?: boolean;
}

export interface HistoryItem {
  id: string;
  name: string;
  size: number;
  sourceFormat: string;
  targetFormat: string;
  timestamp: string;
  status: "completed" | "failed";
  resultName?: string;
  isAiPowered?: boolean;
}

export interface ConversionRoute {
  source: string;
  targets: string[];
}

export interface SeoLandingPage {
  slug: string; // e.g. "pdf-to-docx"
  title: string; // e.g. "PDF to DOCX Converter"
  metaTitle: string;
  metaDescription: string;
  sourceFormat: string;
  targetFormat: string;
  tagline: string;
  aboutText: string;
  howToSteps: string[];
  benefits: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  content: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
