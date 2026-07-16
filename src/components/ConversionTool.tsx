import React, { useState, useRef, useEffect } from "react";
import { FileQueueItem, HistoryItem } from "../types";
import { 
  Upload, FileText, Image as ImageIcon, FileCode, CheckCircle2, AlertCircle, 
  Trash2, Play, Download, Archive, RefreshCw, Eye, Edit2, Check, X, HelpCircle, Sparkles
} from "lucide-react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import confetti from "canvas-confetti";
import * as yaml from "js-yaml";
import { marked } from "marked";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ConversionToolProps {
  onAddToHistory: (item: HistoryItem) => void;
  isDark: boolean;
}

// Client-side docx parser using JSZip and DOMParser
export const parseDocxClient = async (file: File): Promise<{ text: string; html: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXmlText = await zip.file("word/document.xml")?.async("text");
  
  if (!docXmlText) {
    throw new Error("Invalid DOCX format: word/document.xml not found");
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlText, "application/xml");
  const paragraphs = xmlDoc.getElementsByTagName("w:p");
  
  const textLines: string[] = [];
  const htmlLines: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const textNodes = p.getElementsByTagName("w:t");
    let pText = "";
    for (let j = 0; j < textNodes.length; j++) {
      pText += textNodes[j].textContent || "";
    }
    textLines.push(pText);
    htmlLines.push(`<p style="margin-bottom: 12px; line-height: 1.6;">${pText || "&nbsp;"}</p>`);
  }

  return {
    text: textLines.join("\n"),
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${file.name}</title></head><body style="font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333;">${htmlLines.join("")}</body></html>`,
  };
};

// Client-side RTF to plain text cleaner
export const cleanRtfToText = (rtfText: string): string => {
  let text = rtfText.replace(/\\par[d]?/g, "\n");
  text = text.replace(/\\tab/g, "\t");
  text = text.replace(/\\['][0-9a-f]{2}/g, "");
  text = text.replace(/\\{2}/g, "\\");
  text = text.replace(/\\{|\\}/g, "");
  text = text.replace(/\\(\w+)([-?\d]+)? ?/g, "");
  text = text.replace(/[{}]/g, "");
  return text.trim();
};

// Client-side HTML to plain text cleaner
export const cleanHtmlToText = (htmlText: string): string => {
  const tempEl = document.createElement("div");
  tempEl.innerHTML = htmlText;
  return tempEl.textContent || tempEl.innerText || "";
};

// Client-side DOCX creator from text using JSZip
export const createDocxFromText = async (text: string): Promise<Blob> => {
  const zip = new JSZip();
  
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
    
  const lines = escapedText.split(/\r?\n/);
  const paragraphsXml = lines.map(line => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join("");
  
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`);

  return await zip.generateAsync({ type: "blob" });
};

// Client-side PDF builder using pdf-lib
export const convertToPdfClient = async (file: File, sourceFormat: string, fallbackText?: string): Promise<{ content: string; mimeType: string; fileName: string }> => {
  const srcLower = sourceFormat.toLowerCase();
  const pdfDoc = await PDFDocument.create();
  
  if (srcLower === "png" || srcLower === "jpg" || srcLower === "jpeg") {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    if (srcLower === "png") {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }
    
    // Size page exactly to fit image
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
    
    const pdfBytes = await pdfDoc.save();
    const base64 = window.btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    return {
      content: base64,
      mimeType: "application/pdf",
      fileName: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
    };
  } else {
    let text = "";
    if (fallbackText) {
      text = fallbackText;
    } else {
      text = await file.text();
    }
    
    // Clean RTF/HTML markers if needed
    if (srcLower === "rtf") {
      text = cleanRtfToText(text);
    } else if (srcLower === "html") {
      text = cleanHtmlToText(text);
    }
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const margin = 50;
    const pageWidth = 612;
    const pageHeight = 792;
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    
    const rawLines = text.split(/\r?\n/);
    const lines: string[] = [];
    const maxCharsPerLine = 80;
    
    for (const rLine of rawLines) {
      if (rLine.length <= maxCharsPerLine) {
        lines.push(rLine);
      } else {
        let current = "";
        const words = rLine.split(" ");
        for (const word of words) {
          if ((current + " " + word).length <= maxCharsPerLine) {
            current = current ? current + " " + word : word;
          } else {
            lines.push(current);
            current = word;
          }
        }
        if (current) lines.push(current);
      }
    }
    
    for (const line of lines) {
      if (y < margin + 20) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      const cleanLine = line.replace(/[^\x20-\x7E\t]/g, " ");
      page.drawText(cleanLine, {
        x: margin,
        y: y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= fontSize + 4;
    }
    
    const pdfBytes = await pdfDoc.save();
    const base64 = window.btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    return {
      content: base64,
      mimeType: "application/pdf",
      fileName: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
    };
  }
};

interface ConversionToolProps {
  onAddToHistory: (item: HistoryItem) => void;
  isDark: boolean;
}

// Map file extensions to available target extensions
export function getTargetFormats(sourceExt: string): string[] {
  const ext = sourceExt.toLowerCase();
  
  // Document Categories
  if (["pdf"].includes(ext)) {
    return ["docx", "txt", "html", "png", "jpg", "webp", "svg", "epub", "md"];
  }
  if (["doc"].includes(ext)) {
    return ["pdf", "docx", "txt", "html"];
  }
  if (["docx"].includes(ext)) {
    return ["pdf", "txt", "html", "rtf"];
  }
  if (["txt"].includes(ext)) {
    return ["pdf", "docx", "html", "md"];
  }
  if (["rtf"].includes(ext)) {
    return ["pdf", "docx", "txt"];
  }
  if (["odt"].includes(ext)) {
    return ["pdf", "docx"];
  }
  if (["html"].includes(ext)) {
    return ["pdf", "docx", "txt"];
  }
  if (["md", "markdown"].includes(ext)) {
    return ["html", "pdf", "docx", "txt"];
  }

  // Spreadsheet Categories
  if (["csv"].includes(ext)) {
    return ["xlsx", "json", "xml", "tsv"];
  }
  if (["tsv"].includes(ext)) {
    return ["xlsx", "json", "xml", "csv"];
  }
  if (["xlsx", "xls", "ods"].includes(ext)) {
    return ["csv", "tsv", "xlsx", "ods", "json", "html"];
  }

  // PowerPoint Categories
  if (["ppt", "pptx", "odp"].includes(ext)) {
    return ["pdf"];
  }

  // Image Categories
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg", "ico", "avif", "heic"].includes(ext)) {
    return ["png", "jpg", "webp", "gif", "bmp", "ico"];
  }

  // eBook Categories
  if (["epub", "mobi", "azw3", "fb2"].includes(ext)) {
    return ["pdf", "txt", "epub"];
  }

  // Font Categories
  if (["ttf", "otf", "woff", "woff2"].includes(ext)) {
    return ["ttf", "otf", "woff", "woff2"];
  }

  // Code & Config Categories
  if (["json", "xml", "yaml", "yml", "sql", "ini", "toml", "log"].includes(ext)) {
    return ["json", "xml", "yaml", "txt"];
  }

  // Default fallback
  return ["txt"];
}

// Get appropriate lucide icon based on format
export function getFormatIcon(ext: string) {
  const e = ext.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg", "ico", "heic", "avif"].includes(e)) {
    return ImageIcon;
  }
  if (["json", "xml", "yaml", "yml", "sql", "html", "js", "ts", "css", "ini", "toml"].includes(e)) {
    return FileCode;
  }
  return FileText;
}

export default function ConversionTool({ onAddToHistory, isDark }: ConversionToolProps) {
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalTargetFormat, setGlobalTargetFormat] = useState<string>("");
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  
  // Preview and Rename modal/states
  const [previewItem, setPreviewItem] = useState<FileQueueItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewSheetData, setPreviewSheetData] = useState<any[][] | null>(null);
  const [renameItem, setRenameItem] = useState<FileQueueItem | null>(null);
  const [newName, setNewName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file as base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // strip data:image/png;base64, prefix
        resolve(base64String.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Add files to queue
  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: FileQueueItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nameParts = file.name.split(".");
      const ext = nameParts.length > 1 ? nameParts.pop() || "" : "";
      const baseName = nameParts.join(".");

      // Avoid duplicates in current active queue
      if (queue.some(item => item.file.name === file.name && item.status !== "completed" && item.status !== "failed")) {
        continue;
      }

      const availableTargets = getTargetFormats(ext);
      const defaultTarget = availableTargets[0] || "txt";

      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        sourceFormat: ext.toLowerCase(),
        targetFormat: defaultTarget,
        status: "queued",
        progress: 0,
      });
    }

    setQueue(prev => [...prev, ...newItems]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const updateItemTarget = (id: string, target: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, targetFormat: target } : item));
  };

  const applyGlobalTarget = (format: string) => {
    setGlobalTargetFormat(format);
    if (!format) return;
    setQueue(prev => prev.map(item => {
      const targets = getTargetFormats(item.sourceFormat);
      if (targets.includes(format)) {
        return { ...item, targetFormat: format };
      }
      return item;
    }));
  };

  // Convert individual file
  const convertFile = async (item: FileQueueItem) => {
    if (item.status === "converting") return;

    // Update state to converting
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "converting", progress: 20 } : q));

    const sourceExts = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg", "ico"];
    const targetExts = ["png", "jpg", "webp", "gif", "bmp", "ico"];

    // 1. Client-side canvas rendering for Image to Image conversions
    if (sourceExts.includes(item.sourceFormat) && targetExts.includes(item.targetFormat)) {
      try {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        
        // Create an Image object in browser
        const imgUrl = URL.createObjectURL(item.file);
        const img = new Image();
        img.src = imgUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) throw new Error("Could not create 2D canvas context");
        ctx.drawImage(img, 0, 0);

        // Export format mime mapping
        let mime = "image/png";
        if (item.targetFormat === "jpg" || item.targetFormat === "jpeg") mime = "image/jpeg";
        else if (item.targetFormat === "webp") mime = "image/webp";
        else if (item.targetFormat === "gif") mime = "image/gif";
        else if (item.targetFormat === "bmp") mime = "image/bmp";
        else if (item.targetFormat === "ico") mime = "image/x-icon";

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), mime, 0.95);
        });

        if (!blob) throw new Error("Canvas compilation failed");

        const outputName = item.name.replace(/\.[^/.]+$/, "") + `.${item.targetFormat}`;
        const downloadUrl = URL.createObjectURL(blob);

        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: "completed", 
          progress: 100, 
          resultUrl: downloadUrl,
          resultBlob: blob,
          resultName: outputName
        } : q));

        // Add to history
        onAddToHistory({
          id: item.id,
          name: item.name,
          size: item.size,
          sourceFormat: item.sourceFormat,
          targetFormat: item.targetFormat,
          timestamp: new Date().toLocaleTimeString(),
          status: "completed",
          resultName: outputName,
        });

        // Trigger individual success animation
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.8 }
        });

        return;
      } catch (err: any) {
        console.error("Client side image convert failed:", err);
        // Fall back to server if client failed, or throw
      }
    }

    const srcLower = item.sourceFormat.toLowerCase();
    const tgtLower = item.targetFormat.toLowerCase();

    // 2. Client-side direct conversion for standard formats (XLSX, CSV, DOCX, JSON, YAML, XML, MD, PDF)
    let clientConversionResult: { content: string; mimeType: string; fileName: string } | null = null;
    try {
      const spreadsheetFormats = ["xlsx", "xls", "ods", "csv", "tsv"];
      const dataFormats = ["json", "yaml", "yml", "xml", "csv", "ini", "toml"];

      // A. DOCX to HTML / TXT / PDF
      if (srcLower === "docx" && (tgtLower === "html" || tgtLower === "txt" || tgtLower === "text" || tgtLower === "pdf")) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const parsedDoc = await parseDocxClient(item.file);
        
        if (tgtLower === "html") {
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(parsedDoc.html))),
            mimeType: "text/html",
            fileName: item.name.replace(/\.[^/.]+$/, "") + ".html",
          };
        } else if (tgtLower === "pdf") {
          const pdfRes = await convertToPdfClient(item.file, "txt", parsedDoc.text);
          clientConversionResult = pdfRes;
        } else {
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(parsedDoc.text))),
            mimeType: "text/plain",
            fileName: item.name.replace(/\.[^/.]+$/, "") + ".txt",
          };
        }
      }
      // B. Conversion TO PDF (Images or Text document formats to PDF)
      else if (tgtLower === "pdf" && (["png", "jpg", "jpeg", "txt", "md", "markdown", "csv", "tsv", "json", "xml", "yaml", "yml", "html", "rtf"].includes(srcLower))) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const pdfRes = await convertToPdfClient(item.file, srcLower);
        clientConversionResult = pdfRes;
      }
      // C. Conversion TO DOCX (TXT, MD, HTML to DOCX)
      else if (tgtLower === "docx" && (["txt", "md", "markdown", "html"].includes(srcLower))) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const text = await item.file.text();
        const docxBlob = await createDocxFromText(text);
        const binaryString = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const binary = new Uint8Array(reader.result as ArrayBuffer);
            let binStr = "";
            for (let i = 0; i < binary.length; i++) {
              binStr += String.fromCharCode(binary[i]);
            }
            resolve(window.btoa(binStr));
          };
          reader.readAsArrayBuffer(docxBlob);
        });
        clientConversionResult = {
          content: binaryString,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileName: item.name.replace(/\.[^/.]+$/, "") + ".docx",
        };
      }
      // D. RTF to TXT
      else if (srcLower === "rtf" && (tgtLower === "txt" || tgtLower === "text")) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const text = await item.file.text();
        const cleanedText = cleanRtfToText(text);
        clientConversionResult = {
          content: window.btoa(unescape(encodeURIComponent(cleanedText))),
          mimeType: "text/plain",
          fileName: item.name.replace(/\.[^/.]+$/, "") + ".txt",
        };
      }
      // E. HTML to TXT
      else if (srcLower === "html" && (tgtLower === "txt" || tgtLower === "text")) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const text = await item.file.text();
        const cleanedText = cleanHtmlToText(text);
        clientConversionResult = {
          content: window.btoa(unescape(encodeURIComponent(cleanedText))),
          mimeType: "text/plain",
          fileName: item.name.replace(/\.[^/.]+$/, "") + ".txt",
        };
      }
      // F. Spreadsheets (xlsx, xls, ods, csv, tsv)
      else if (spreadsheetFormats.includes(srcLower) && spreadsheetFormats.includes(tgtLower)) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const arrayBuffer = await item.file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (tgtLower === "csv" || tgtLower === "tsv") {
          const csvContent = XLSX.utils.sheet_to_csv(worksheet, {
            FS: tgtLower === "tsv" ? "\t" : ",",
          });
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(csvContent))),
            mimeType: tgtLower === "tsv" ? "text/tab-separated-values" : "text/csv",
            fileName: item.name.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
          };
        } else if (tgtLower === "json") {
          const jsonContent = XLSX.utils.sheet_to_json(worksheet);
          const jsonString = JSON.stringify(jsonContent, null, 2);
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(jsonString))),
            mimeType: "application/json",
            fileName: item.name.replace(/\.[^/.]+$/, "") + ".json",
          };
        } else if (tgtLower === "html") {
          const htmlContent = XLSX.utils.sheet_to_html(worksheet);
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(htmlContent))),
            mimeType: "text/html",
            fileName: item.name.replace(/\.[^/.]+$/, "") + ".html",
          };
        } else {
          // Excel/ODS writing
          const writeType = tgtLower === "ods" ? "ods" : "xlsx";
          const outBuffer = XLSX.write(workbook, { bookType: writeType, type: "array" });
          const binary = new Uint8Array(outBuffer);
          let binaryString = "";
          for (let i = 0; i < binary.length; i++) {
            binaryString += String.fromCharCode(binary[i]);
          }
          const base64 = window.btoa(binaryString);
          clientConversionResult = {
            content: base64,
            mimeType: tgtLower === "ods" ? "application/vnd.oasis.opendocument.spreadsheet" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName: item.name.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
          };
        }
      }
      // G. Data formats (json, yaml, yml, xml, csv, ini, toml)
      else if (dataFormats.includes(srcLower) && dataFormats.includes(tgtLower)) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const text = await item.file.text();
        let parsedData: any = null;

        if (srcLower === "json") {
          parsedData = JSON.parse(text);
        } else if (srcLower === "yaml" || srcLower === "yml") {
          parsedData = yaml.load(text);
        } else if (srcLower === "csv") {
          const arrayBuffer = await item.file.arrayBuffer();
          const tempWorkbook = XLSX.read(arrayBuffer, { type: "array" });
          parsedData = XLSX.utils.sheet_to_json(tempWorkbook.Sheets[tempWorkbook.SheetNames[0]]);
        } else {
          parsedData = { text };
        }

        let outputText = "";
        let mimeType = "text/plain";
        if (tgtLower === "json") {
          outputText = JSON.stringify(parsedData, null, 2);
          mimeType = "application/json";
        } else if (tgtLower === "yaml" || tgtLower === "yml") {
          outputText = yaml.dump(parsedData);
          mimeType = "text/yaml";
        } else if (tgtLower === "csv") {
          const tempSheet = XLSX.utils.json_to_sheet(Array.isArray(parsedData) ? parsedData : [parsedData]);
          outputText = XLSX.utils.sheet_to_csv(tempSheet);
          mimeType = "text/csv";
        } else if (tgtLower === "xml") {
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
          outputText = `<?xml version="1.0" encoding="UTF-8"?>\n` + buildXml(parsedData);
          mimeType = "application/xml";
        } else {
          outputText = typeof parsedData === "string" ? parsedData : JSON.stringify(parsedData, null, 2);
        }

        clientConversionResult = {
          content: window.btoa(unescape(encodeURIComponent(outputText))),
          mimeType,
          fileName: item.name.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
        };
      }
      // H. Markdown to HTML / TXT
      else if ((srcLower === "md" || srcLower === "markdown") && (tgtLower === "html" || tgtLower === "txt")) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));
        const text = await item.file.text();
        if (tgtLower === "html") {
          const htmlContent = marked.parse(text);
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(htmlContent as string))),
            mimeType: "text/html",
            fileName: item.name.replace(/\.[^/.]+$/, "") + ".html",
          };
        } else {
          clientConversionResult = {
            content: window.btoa(unescape(encodeURIComponent(text))),
            mimeType: "text/plain",
            fileName: item.name.replace(/\.[^/.]+$/, "") + ".txt",
          };
        }
      }
    } catch (clientErr: any) {
      console.warn("Direct client-side conversion failed, trying server fallback...", clientErr);
    }

    if (clientConversionResult) {
      const binaryStr = window.atob(clientConversionResult.content);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const outputBlob = new Blob([bytes], { type: clientConversionResult.mimeType });
      const downloadUrl = URL.createObjectURL(outputBlob);

      setQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: "completed", 
        progress: 100, 
        resultUrl: downloadUrl,
        resultBlob: outputBlob,
        resultName: clientConversionResult!.fileName,
        isAiPowered: false
      } : q));

      onAddToHistory({
        id: item.id,
        name: item.name,
        size: item.size,
        sourceFormat: item.sourceFormat,
        targetFormat: item.targetFormat,
        timestamp: new Date().toLocaleTimeString(),
        status: "completed",
        resultName: clientConversionResult.fileName,
        isAiPowered: false
      });

      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 }
      });
      return;
    }

    // 3. Full-stack Server route conversion fallback (for PDF/eBook or server-side only conversions)
    try {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 40 } : q));
      
      const fileBase64 = await fileToBase64(item.file);
      
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 60 } : q));

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: item.name,
          fileContent: fileBase64,
          sourceFormat: item.sourceFormat,
          targetFormat: item.targetFormat,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server conversion failed");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed converting file");
      }

      // Convert returned base64 back to blob
      const binaryStr = window.atob(data.content);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const outputBlob = new Blob([bytes], { type: data.mimeType || "application/octet-stream" });
      const downloadUrl = URL.createObjectURL(outputBlob);

      setQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: "completed", 
        progress: 100, 
        resultUrl: downloadUrl,
        resultBlob: outputBlob,
        resultName: data.fileName,
        isAiPowered: data.isAiPowered
      } : q));

      onAddToHistory({
        id: item.id,
        name: item.name,
        size: item.size,
        sourceFormat: item.sourceFormat,
        targetFormat: item.targetFormat,
        timestamp: new Date().toLocaleTimeString(),
        status: "completed",
        resultName: data.fileName,
        isAiPowered: data.isAiPowered
      });

    } catch (error: any) {
      console.error("Server conversion failed:", error);
      
      let userFriendlyError = error.message || "Unknown conversion error";
      if (error instanceof TypeError || error.message?.includes("Failed to fetch") || error.message?.includes("404")) {
        userFriendlyError = `Advanced conversions (PDF/eBook) require backend APIs. Please run ConvertNest in our full-stack container environment to enable this format!`;
      }

      setQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: "failed", 
        progress: 100, 
        error: userFriendlyError 
      } : q));

      onAddToHistory({
        id: item.id,
        name: item.name,
        size: item.size,
        sourceFormat: item.sourceFormat,
        targetFormat: item.targetFormat,
        timestamp: new Date().toLocaleTimeString(),
        status: "failed",
      });
    }
  };

  const convertAll = async () => {
    const pending = queue.filter(item => item.status === "queued" || item.status === "failed");
    if (pending.length === 0) return;

    setIsConvertingAll(true);
    for (const item of pending) {
      await convertFile(item);
    }
    setIsConvertingAll(false);

    // Final celebration confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Download all individual files
  const downloadAll = () => {
    queue.forEach(item => {
      if (item.status === "completed" && item.resultUrl && item.resultName) {
        const link = document.createElement("a");
        link.href = item.resultUrl;
        link.download = item.resultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  // Download all zipped
  const downloadAllAsZip = async () => {
    const completedItems = queue.filter(item => item.status === "completed" && item.resultBlob && item.resultName);
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    completedItems.forEach(item => {
      if (item.resultBlob && item.resultName) {
        zip.file(item.resultName, item.resultBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    
    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = `convertnest-batch-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview supported file
  const showFilePreview = async (item: FileQueueItem) => {
    setPreviewItem(item);
    setPreviewContent(null);
    setPreviewImage(null);
    setPreviewSheetData(null);

    const isImg = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(item.sourceFormat);
    const isTxt = ["txt", "md", "html", "json", "xml", "yaml", "yml", "ini", "toml", "log"].includes(item.sourceFormat);
    const isSheet = ["xlsx", "xls", "ods", "csv"].includes(item.sourceFormat);

    if (isImg) {
      const url = URL.createObjectURL(item.file);
      setPreviewImage(url);
    } else if (isTxt) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewContent(e.target?.result as string);
      };
      reader.readAsText(item.file);
    } else if (isSheet) {
      try {
        const dataArr = await item.file.arrayBuffer();
        const workbook = XLSX.read(dataArr, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        setPreviewSheetData(rawJson.slice(0, 30)); // limit rows for quick view
      } catch (e) {
        setPreviewContent("Failed parsing preview sheet");
      }
    } else {
      setPreviewContent(`Pre-conversion preview is not supported for binary file type: ${item.sourceFormat.toUpperCase()}`);
    }
  };

  // Open Rename input
  const openRenameModal = (item: FileQueueItem) => {
    setRenameItem(item);
    setNewName(item.name.split(".").slice(0, -1).join("."));
  };

  const saveRename = () => {
    if (renameItem && newName.trim()) {
      const ext = renameItem.name.split(".").pop();
      const updatedName = `${newName.trim()}.${ext}`;
      
      // Update file object name or keep record updated
      setQueue(prev => prev.map(q => q.id === renameItem.id ? { ...q, name: updatedName } : q));
      setRenameItem(null);
    }
  };

  return (
    <div className="space-y-6" id="conversion-tool-root">
      {/* Welcome Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-2 py-4">
        <h1 className="font-sans font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-white">
          Convert Any File <span className="text-indigo-600 dark:text-indigo-400">Instantly</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
          Free universal batch converter with absolute confidentiality. All document, image, spreadsheet, eBook, and configuration files are processed securely in your sandbox.
        </p>
      </div>

      {/* High Density Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: Supported Categories & Live Format Reference */}
        <aside className="col-span-12 lg:col-span-3 space-y-4 bg-white/40 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-white/5 rounded-2xl">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Format Matrix</span>
          </div>
          
          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                <span>📄 Documents</span>
                <span className="text-[10px] font-mono text-indigo-500">Local + AI</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px]">pdf, docx, doc, txt, rtf, odt, html, md</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                <span>🖼️ Images</span>
                <span className="text-[10px] font-mono text-cyan-500">Local</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px]">png, jpg, jpeg, webp, gif, bmp, svg, ico, avif</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                <span>📊 Spreadsheets</span>
                <span className="text-[10px] font-mono text-emerald-500">Local</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px]">xlsx, xls, ods, csv, tsv</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                <span>📚 eBooks</span>
                <span className="text-[10px] font-mono text-purple-500">Local</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px]">epub, mobi, azw3, fb2</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
                <span>⚙️ Configuration</span>
                <span className="text-[10px] font-mono text-amber-500">Local</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px]">json, xml, yaml, sql, ini, toml</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            <span className="font-semibold block text-slate-600 dark:text-slate-400">Sandbox Protection:</span>
            <span>All conversions run entirely within client memory unless complex formatting triggers the server-side processor.</span>
          </div>
        </aside>

        {/* Center Panel: Drag and Drop + Active Queue */}
        <main className="col-span-12 lg:col-span-6 space-y-6">
          {/* Drag and Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer group rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center ${
              isDragging 
                ? "border-cyan-500 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10" 
                : "border-slate-300 dark:border-white/10 bg-white/40 dark:bg-slate-900/30 hover:border-indigo-500 hover:bg-indigo-500/5 dark:hover:border-indigo-400/30"
            } backdrop-blur-md`}
            id="drag-drop-zone"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple 
              className="hidden" 
              id="file-selector-input"
            />
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-sans font-semibold text-base text-slate-800 dark:text-slate-200">
                  Drag & Drop files here, or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Fast client-side rendering for image, sheet, ebook, config, font, and document extensions.
                </p>
              </div>
            </div>
          </div>

          {/* Queue Manager & Converter Table */}
          {queue.length > 0 && (
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden" id="queue-manager">
              
              {/* Global Configuration Bar */}
              <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Queue Size: <span className="text-indigo-600 dark:text-indigo-400">{queue.length} files</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Convert all to:</span>
                    <select
                      value={globalTargetFormat}
                      onChange={(e) => applyGlobalTarget(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                      id="global-format-selector"
                    >
                      <option value="">Select target...</option>
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                      <option value="txt">TXT (Text)</option>
                      <option value="html">HTML</option>
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="webp">WEBP</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="xlsx">Excel (XLSX)</option>
                      <option value="zip">ZIP</option>
                    </select>
                  </div>

                  <button
                    onClick={clearQueue}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
                    title="Clear all"
                    id="clear-queue-btn"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Files List Table */}
              <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[380px] overflow-y-auto">
                {queue.map((item) => {
                  const FormatIcon = getFormatIcon(item.sourceFormat);
                  const targets = getTargetFormats(item.sourceFormat);
                  
                  return (
                    <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors duration-200">
                      
                      {/* File Info Block */}
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className="p-2.5 bg-indigo-500/10 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
                          <FormatIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-sans font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                              {item.name}
                            </p>
                            <button
                              onClick={() => openRenameModal(item)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity duration-200"
                              title="Rename file"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {(item.size / 1024 / 1024).toFixed(2)} MB • {item.sourceFormat.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Options, Preview and Actions */}
                      <div className="flex flex-wrap items-center gap-3 md:justify-end">
                        
                        {/* Preview button */}
                        <button
                          onClick={() => showFilePreview(item)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-400/10 rounded-lg transition-all duration-200"
                          title="Preview file"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Target Format Dropdown */}
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-400">to</span>
                          <select
                            value={item.targetFormat}
                            onChange={(e) => updateItemTarget(item.id, e.target.value)}
                            disabled={item.status === "converting" || item.status === "completed"}
                            className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {targets.map(t => (
                              <option key={t} value={t}>{t.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status Display */}
                        <div className="w-24 flex justify-center">
                          {item.status === "queued" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Queued
                            </span>
                          )}
                          {item.status === "converting" && (
                            <div className="flex flex-col items-center w-full space-y-1">
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-1 rounded-full transition-all duration-300" 
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-indigo-500 font-semibold animate-pulse">
                                Converting...
                              </span>
                            </div>
                          )}
                          {item.status === "completed" && (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                Success
                              </span>
                              {item.isAiPowered && (
                                <span className="text-[8px] text-purple-500 dark:text-purple-400 font-bold flex items-center mt-0.5">
                                  <Sparkles className="h-2 w-2 mr-0.5 animate-pulse" />
                                  AI-Enhanced
                                </span>
                              )}
                            </div>
                          )}
                          {item.status === "failed" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" title={item.error}>
                              <AlertCircle className="h-2.5 w-2.5 mr-1" />
                              Failed
                            </span>
                          )}
                        </div>

                        {/* Downloader or Play controls */}
                        <div className="flex items-center space-x-1">
                          {item.status === "completed" && item.resultUrl && (
                            <a
                              href={item.resultUrl}
                              download={item.resultName || `converted-file.${item.targetFormat}`}
                              className="p-1.5 text-white bg-gradient-to-tr from-emerald-500 to-teal-600 hover:scale-105 rounded-lg shadow-md shadow-emerald-500/20 transition-all duration-200"
                              title="Download result"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {(item.status === "queued" || item.status === "failed") && (
                            <button
                              onClick={() => convertFile(item)}
                              disabled={isConvertingAll}
                              className="p-1.5 text-white bg-gradient-to-tr from-indigo-500 to-purple-600 hover:scale-105 disabled:opacity-50 rounded-lg shadow-md shadow-indigo-500/20 transition-all duration-200"
                              title="Convert individual file"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => removeQueueItem(item.id)}
                            disabled={item.status === "converting"}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
                            title="Remove file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </main>

        {/* Right Sidebar: Batch Operations & Highlights */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white/40 dark:bg-slate-900/30 p-5 border border-slate-200 dark:border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-mono">Workspace Operations</span>
            </div>

            {/* If files exist, show big batch operations, else show stats guidelines */}
            {queue.length > 0 ? (
              <div className="space-y-4">
                <button
                  onClick={convertAll}
                  disabled={isConvertingAll || !queue.some(q => q.status === "queued" || q.status === "failed")}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/10 hover:scale-[1.01] active:scale-95 transition-all duration-150 disabled:opacity-40"
                  id="convert-all-btn"
                >
                  {isConvertingAll ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Convert All Files</span>
                    </>
                  )}
                </button>

                {queue.some(q => q.status === "completed") && (
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <button
                      onClick={downloadAll}
                      className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs hover:bg-slate-300 dark:hover:bg-white/10 transition-all duration-150"
                      id="download-all-btn"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download All ({queue.filter(q => q.status === "completed").length})</span>
                    </button>
                    <button
                      onClick={downloadAllAsZip}
                      className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-lg font-semibold text-xs shadow-sm hover:scale-[1.01] transition-all duration-150"
                      id="download-zip-btn"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Save Entire Queue (.ZIP)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                <p>Queue is empty.</p>
                <p className="mt-1">Drag and drop file elements into the canvas area to activate batch options.</p>
              </div>
            )}
          </div>

          {/* Staggered Highlights aligned vertically with the High Density Design */}
          <div className="space-y-4">
            <div className="bg-white/40 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-indigo-500">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200">AI-Enhanced Formatting</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Integrates server-side Gemini AI models to guarantee seamless conversions of complex layout files like PDF, ODT, eBooks, and legacy Word docs.
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-cyan-500">
                <Archive className="h-4 w-4" />
                <span className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200">Batch Processing</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Queue and process dozens of files simultaneously. Re-download your queue items individually or compiled cleanly in a single ZIP archive.
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200">Absolute Confidentiality</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                All data parsing of structures like JSON, XML, YAML, images, spreadsheets, and ZIPs runs completely in the browser sandbox.
              </p>
            </div>
          </div>
        </aside>

      </div>

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">Rename File</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">File Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                placeholder="Enter new file name..."
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRenameItem(null)}
                className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={saveRename}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-500/10 transition-all duration-150"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">File Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">{previewItem.name} ({(previewItem.size / 1024 / 1024).toFixed(2)} MB)</p>
              </div>
              <button
                onClick={() => {
                  setPreviewItem(null);
                  setPreviewImage(null);
                  setPreviewContent(null);
                  setPreviewSheetData(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-5 min-h-[250px] flex items-center justify-center">
              {previewImage && (
                <img 
                  src={previewImage} 
                  alt="File preview" 
                  className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-md border dark:border-white/5"
                  referrerPolicy="no-referrer"
                />
              )}
              {previewContent && (
                <pre className="w-full text-xs font-mono bg-slate-950 text-emerald-400 p-5 rounded-xl overflow-auto max-h-[50vh] text-left leading-relaxed">
                  {previewContent}
                </pre>
              )}
              {previewSheetData && (
                <div className="w-full overflow-auto max-h-[50vh] border dark:border-white/5 rounded-xl">
                  <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                    <thead className="text-[10px] uppercase bg-slate-50 dark:bg-slate-950 font-bold border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-400">
                      <tr>
                        {previewSheetData[0]?.map((col, index) => (
                          <th key={index} className="px-4 py-3 border-r dark:border-white/5">{String(col || "")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {previewSheetData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 border-r dark:border-white/5">{String(cell || "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!previewImage && !previewContent && !previewSheetData && (
                <div className="text-center space-y-2">
                  <HelpCircle className="h-10 w-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Rendering preview...</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button
                onClick={() => {
                  setPreviewItem(null);
                  setPreviewImage(null);
                  setPreviewContent(null);
                  setPreviewSheetData(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-all duration-150"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
