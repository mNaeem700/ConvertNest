import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as yaml from "js-yaml";
import { marked } from "marked";

const app = express();
const PORT = 3000;

// Set up JSON body parsing with large limit for base64 file payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini AI Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI Client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not configured or is placeholder. AI conversion features will fall back.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI Client:", error);
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiEnabled: !!ai,
  });
});

// Primary Conversion Endpoint
app.post("/api/convert", async (req, res) => {
  try {
    const { fileName, fileContent, sourceFormat, targetFormat, options } = req.body;

    if (!fileContent) {
      return res.status(400).json({ error: "No file content provided" });
    }

    const srcLower = (sourceFormat || "").toLowerCase();
    const tgtLower = (targetFormat || "").toLowerCase();

    // Decode base64
    const buffer = Buffer.from(fileContent, "base64");

    // 1. DOCX -> HTML / TXT using mammoth
    if (srcLower === "docx" && (tgtLower === "html" || tgtLower === "txt" || tgtLower === "text")) {
      const result = (await mammoth.convertToHtml({ buffer })) as any;
      const htmlContent = result.value;
      const warnings = result.warnings;

      if (tgtLower === "html") {
        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + ".html",
          content: Buffer.from(htmlContent).toString("base64"),
          mimeType: "text/html",
          warnings,
        });
      } else {
        // Simple plain text conversion
        const textResult = await mammoth.extractRawText({ buffer });
        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + ".txt",
          content: Buffer.from(textResult.value).toString("base64"),
          mimeType: "text/plain",
          warnings,
        });
      }
    }

    // 2. Spreadsheets (XLSX, XLS, ODS, CSV) -> XLS, XLSX, ODS, CSV, HTML, JSON
    const spreadsheetFormats = ["xlsx", "xls", "ods", "csv", "tsv"];
    if (spreadsheetFormats.includes(srcLower) && spreadsheetFormats.includes(tgtLower)) {
      // Read sheet using XLSX
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (tgtLower === "csv" || tgtLower === "tsv") {
        const csvContent = XLSX.utils.sheet_to_csv(worksheet, {
          FS: tgtLower === "tsv" ? "\t" : ",",
        });
        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
          content: Buffer.from(csvContent).toString("base64"),
          mimeType: tgtLower === "tsv" ? "text/tab-separated-values" : "text/csv",
        });
      } else if (tgtLower === "json") {
        const jsonContent = XLSX.utils.sheet_to_json(worksheet);
        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + ".json",
          content: Buffer.from(JSON.stringify(jsonContent, null, 2)).toString("base64"),
          mimeType: "application/json",
        });
      } else if (tgtLower === "html") {
        const htmlContent = XLSX.utils.sheet_to_html(worksheet);
        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + ".html",
          content: Buffer.from(htmlContent).toString("base64"),
          mimeType: "text/html",
        });
      } else {
        // Excel to Excel/ODS
        const outputBuffer = XLSX.write(workbook, {
          bookType: tgtLower === "ods" ? "ods" : "xlsx",
          type: "buffer",
        });
        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
          content: outputBuffer.toString("base64"),
          mimeType: tgtLower === "ods" ? "application/vnd.oasis.opendocument.spreadsheet" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      }
    }

    // 3. Structured Data conversions: JSON <-> YAML <-> XML <-> CSV
    const dataFormats = ["json", "yaml", "xml", "csv", "ini", "toml"];
    if (dataFormats.includes(srcLower) && dataFormats.includes(tgtLower)) {
      const textDecoder = new TextDecoder();
      const textContent = textDecoder.decode(buffer);
      let parsedData: any = null;

      try {
        // Parse input
        if (srcLower === "json") {
          parsedData = JSON.parse(textContent);
        } else if (srcLower === "yaml") {
          parsedData = yaml.load(textContent);
        } else if (srcLower === "csv") {
          const tempWorkbook = XLSX.read(buffer, { type: "buffer" });
          parsedData = XLSX.utils.sheet_to_json(tempWorkbook.Sheets[tempWorkbook.SheetNames[0]]);
        } else {
          parsedData = { text: textContent };
        }

        // Format output
        let outputText = "";
        let mimeType = "text/plain";
        if (tgtLower === "json") {
          outputText = JSON.stringify(parsedData, null, 2);
          mimeType = "application/json";
        } else if (tgtLower === "yaml") {
          outputText = yaml.dump(parsedData);
          mimeType = "text/yaml";
        } else if (tgtLower === "csv") {
          const tempSheet = XLSX.utils.json_to_sheet(Array.isArray(parsedData) ? parsedData : [parsedData]);
          const tempBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(tempBook, tempSheet, "Sheet1");
          outputText = XLSX.utils.sheet_to_csv(tempSheet);
          mimeType = "text/csv";
        } else if (tgtLower === "xml") {
          // Simple JSON to XML
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

        return res.json({
          success: true,
          fileName: fileName.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
          content: Buffer.from(outputText).toString("base64"),
          mimeType,
        });
      } catch (err: any) {
        console.error("Data conversion error:", err);
        // Fall back to AI conversion if parsing failed and AI is available
      }
    }

    // 4. AI-Powered Fallback Conversion using Gemini 3.5 Flash
    // This handles complex eBook formatting, DOCX styling transformations, RTF layouting, PDF text extraction / formatting
    if (ai) {
      console.log(`Using Gemini AI to convert ${srcLower} -> ${tgtLower}`);
      const textDecoder = new TextDecoder();
      let fileText = "";
      
      try {
        if (srcLower === "docx") {
          const textRes = await mammoth.extractRawText({ buffer });
          fileText = textRes.value;
        } else {
          fileText = textDecoder.decode(buffer);
        }
      } catch (e) {
        fileText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, ""); // strip non-ascii
      }

      if (fileText.length > 200000) {
        fileText = fileText.slice(0, 200000) + "\n\n[Content truncated for length limit]";
      }

      const prompt = `You are an expert file converter. Convert the following document content from format "${srcLower}" to format "${tgtLower}".
Return ONLY the raw converted file contents. Do not include any explanation, do not include markdown code block formatting or backticks around the output, do not add introductory text. Simply output the exact valid string or representation of target format.

Source file name: "${fileName}"
Source format: ${srcLower}
Target format: ${tgtLower}

Content to convert:
---
${fileText}
---`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      let convertedContent = aiResponse.text || "";
      
      // Strip markdown code block wrapper if model ignored instructions
      if (convertedContent.startsWith("```")) {
        const firstLineEnd = convertedContent.indexOf("\n");
        const lastTicks = convertedContent.lastIndexOf("```");
        if (firstLineEnd !== -1 && lastTicks !== -1) {
          convertedContent = convertedContent.substring(firstLineEnd + 1, lastTicks).trim();
        }
      }

      let mimeType = "text/plain";
      if (tgtLower === "html") mimeType = "text/html";
      else if (tgtLower === "markdown" || tgtLower === "md") mimeType = "text/markdown";
      else if (tgtLower === "json") mimeType = "application/json";
      else if (tgtLower === "xml") mimeType = "application/xml";

      return res.json({
        success: true,
        fileName: fileName.replace(/\.[^/.]+$/, "") + `.${tgtLower}`,
        content: Buffer.from(convertedContent).toString("base64"),
        mimeType,
        isAiPowered: true,
      });
    }

    // Default error if conversion unsupported or fails
    return res.status(400).json({
      error: `Conversion from ${srcLower.toUpperCase()} to ${tgtLower.toUpperCase()} is not fully supported offline on our free tier. Try a different format!`,
    });
  } catch (error: any) {
    console.error("Conversion server error:", error);
    res.status(500).json({ error: error.message || "An error occurred during file conversion" });
  }
});

// Code validate, format / beautify and minify route
app.post("/api/toolbox", async (req, res) => {
  try {
    const { code, language, action } = req.body;
    if (!code) return res.status(400).json({ error: "Code content is empty" });

    const lang = (language || "").toLowerCase();
    const act = (action || "beautify").toLowerCase();

    if (act === "validate") {
      if (lang === "json") {
        try {
          JSON.parse(code);
          return res.json({ valid: true, message: "Valid JSON format!" });
        } catch (e: any) {
          return res.json({ valid: false, message: e.message });
        }
      } else if (lang === "yaml") {
        try {
          yaml.load(code);
          return res.json({ valid: true, message: "Valid YAML format!" });
        } catch (e: any) {
          return res.json({ valid: false, message: e.message });
        }
      }
      
      // Fallback for complex validation using Gemini
      if (ai) {
        const validatePrompt = `You are a code syntax checker. Analyze the following "${lang}" code for syntax errors. 
Determine if it is valid or invalid. Respond in JSON format exactly with schema:
{
  "valid": boolean,
  "message": "A helpful message describing validation result or highlighting exactly where the syntax error is located."
}
Only output the JSON object. No backticks.

Code:
${code}`;
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: validatePrompt,
          config: { responseMimeType: "application/json" }
        });
        const result = JSON.parse(aiResponse.text || "{}");
        return res.json(result);
      }
      return res.json({ valid: true, message: "Syntactic validation is not available for this language offline." });
    }

    if (act === "beautify") {
      if (lang === "json") {
        try {
          const parsed = JSON.parse(code);
          return res.json({ success: true, result: JSON.stringify(parsed, null, 2) });
        } catch (e: any) {
          return res.status(400).json({ error: "Invalid JSON: " + e.message });
        }
      }
      
      // Fallback for general formatting/beautification
      if (ai) {
        const formatPrompt = `You are a code formatter. Beautify and pretty-print the following "${lang}" code. 
Apply professional indentation, spacing, and styling conventions. 
Return ONLY the formatted code. No markdown code blocks, no explanations.

Code:
${code}`;
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: formatPrompt,
        });
        return res.json({ success: true, result: aiResponse.text?.trim() });
      }
    }

    if (act === "minify") {
      if (lang === "json") {
        try {
          const parsed = JSON.parse(code);
          return res.json({ success: true, result: JSON.stringify(parsed) });
        } catch (e: any) {
          return res.status(400).json({ error: "Invalid JSON: " + e.message });
        }
      }
      
      // Fallback for minification
      if (ai) {
        const minifyPrompt = `You are a code minifier. Minify the following "${lang}" code. 
Remove all unnecessary whitespace, indentation, line breaks, and comments while keeping the code perfectly functional.
Return ONLY the minified code. No markdown code blocks, no explanations.

Code:
${code}`;
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: minifyPrompt,
        });
        return res.json({ success: true, result: aiResponse.text?.trim() });
      }
    }

    return res.status(400).json({ error: "Unsupported toolbox action or language" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Toolbox action failed" });
  }
});

// Setup Vite Dev Middleware / Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ConvertNest Server running at http://localhost:${PORT}`);
  });
}

startServer();
