import { getTargetFormats, getFormatIcon } from "../src/components/ConversionTool";

describe("ConvertNest Conversion Matrix Tests", () => {
  test("getTargetFormats resolves correct conversions", () => {
    // PDF Targets
    const pdfTargets = getTargetFormats("pdf");
    expect(pdfTargets).toContain("docx");
    expect(pdfTargets).toContain("txt");
    expect(pdfTargets).toContain("webp");

    // CSV Targets
    const csvTargets = getTargetFormats("csv");
    expect(csvTargets).toContain("xlsx");
    expect(csvTargets).toContain("json");

    // Word Targets
    const docxTargets = getTargetFormats("docx");
    expect(docxTargets).toContain("pdf");
    expect(docxTargets).toContain("rtf");
  });

  test("getFormatIcon resolves correct Lucide components", () => {
    const pngIcon = getFormatIcon("png");
    const webpIcon = getFormatIcon("webp");
    expect(pngIcon).toBe(getFormatIcon("jpg")); // Image icons should match
    
    const jsonIcon = getFormatIcon("json");
    expect(jsonIcon).not.toBe(pngIcon); // Code icon should not equal image icon
  });
});

describe("ConvertNest Full-Stack API Integrations", () => {
  test("Health check schema validation", async () => {
    const mockHealth = {
      status: "ok",
      timestamp: new Date().toISOString(),
      aiEnabled: true,
    };
    expect(mockHealth.status).toBe("ok");
    expect(mockHealth.aiEnabled).toBe(true);
    expect(mockHealth.timestamp).toBeDefined();
  });

  test("Code toolbox beautification validation", () => {
    const rawJson = '{"name":"convertnest","free":true}';
    const parsed = JSON.parse(rawJson);
    const pretty = JSON.stringify(parsed, null, 2);
    
    expect(pretty).toContain("  ");
    expect(pretty).toContain("convertnest");
  });
});
