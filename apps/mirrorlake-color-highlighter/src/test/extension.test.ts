import * as assert from "assert";
import * as vscode from "vscode";
import { ColorDetector } from "../utils/colorDetector";
import { FileUtils } from "../utils/fileUtils";
import type { ConfigurationManager } from "../config/configurationManager";

// Mock ConfigurationManager for tests
function createMockConfigManager(
  overrides: Partial<{
    namedColors: boolean;
    rgb4: boolean;
    languages: string[];
    globs: string[];
  }> = {}
): ConfigurationManager {
  return {
    isNamedColorEnabled: () => overrides.namedColors ?? false,
    isRgb4Enabled: () => overrides.rgb4 ?? false,
    getSupportedLanguages: () => overrides.languages ?? [],
    getSupportedFileGlobs: () => overrides.globs ?? [],
  } as unknown as ConfigurationManager;
}

// Helper to create a text document from content
async function createDocument(
  content: string,
  language = "css"
): Promise<vscode.TextDocument> {
  const doc = await vscode.workspace.openTextDocument({
    content,
    language,
  });
  return doc;
}

suite("ColorDetector", () => {
  const detector = new ColorDetector();
  const defaultConfig = createMockConfigManager();

  test("detects HEX colors (#RRGGBB)", async () => {
    const doc = await createDocument("color: #FF0000;");
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    assert.ok(result["#FF0000"], "Should detect #FF0000");
    assert.strictEqual(result["#FF0000"].length, 1);
  });

  test("detects short HEX colors (#RGB)", async () => {
    const doc = await createDocument("color: #abc;");
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    assert.ok(result["#abc"], "Should detect #abc");
  });

  test("detects RGB colors", async () => {
    const doc = await createDocument("color: rgb(255, 0, 0);");
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    assert.ok(result["rgb(255, 0, 0)"], "Should detect rgb(255, 0, 0)");
  });

  test("detects RGBA colors", async () => {
    const doc = await createDocument("color: rgba(255, 0, 0, 0.5);");
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    assert.ok(result["rgba(255, 0, 0, 0.5)"], "Should detect rgba(255, 0, 0, 0.5)");
  });

  test("detects HSL colors", async () => {
    const doc = await createDocument("color: hsl(0, 100%, 50%);");
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    assert.ok(result["hsl(0, 100%, 50%)"], "Should detect hsl(0, 100%, 50%)");
  });

  test("detects multiple colors in one document", async () => {
    const doc = await createDocument(
      "color: #FF0000; background: rgb(0, 255, 0); border: hsl(240, 100%, 50%);"
    );
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    const colorCount = Object.keys(result).length;
    assert.ok(colorCount >= 3, `Should detect at least 3 colors, found ${colorCount}`);
  });

  test("does NOT detect named colors when disabled", async () => {
    const doc = await createDocument("color: red;");
    const config = createMockConfigManager({ namedColors: false });
    const result = detector.detectColors(doc.getText(), doc, config);
    assert.strictEqual(result["red"], undefined, "Should not detect named color 'red'");
  });

  test("returns empty for document without colors", async () => {
    const doc = await createDocument("body { margin: 0; padding: 0; }");
    const result = detector.detectColors(doc.getText(), doc, defaultConfig);
    assert.strictEqual(Object.keys(result).length, 0, "Should find no colors");
  });
});

suite("FileUtils", () => {
  test("getDefaultSupportedLanguages returns expected languages", () => {
    const languages = FileUtils.getDefaultSupportedLanguages();
    assert.ok(languages.includes("css"), "Should include css");
    assert.ok(languages.includes("typescript"), "Should include typescript");
    assert.ok(languages.includes("typescriptreact"), "Should include typescriptreact");
    assert.ok(languages.includes("html"), "Should include html");
    assert.ok(languages.includes("vue"), "Should include vue");
  });

  test("getDefaultSupportedGlobs returns glob patterns", () => {
    const globs = FileUtils.getDefaultSupportedGlobs();
    assert.ok(globs.includes("*.css"), "Should include *.css");
    assert.ok(globs.includes("*.tsx"), "Should include *.tsx");
    assert.ok(globs.includes("*.html"), "Should include *.html");
  });

  test("getExtensionsForLanguage returns correct globs", () => {
    assert.deepStrictEqual(FileUtils.getExtensionsForLanguage("css"), ["*.css"]);
    assert.deepStrictEqual(FileUtils.getExtensionsForLanguage("html"), ["*.html", "*.htm"]);
    assert.deepStrictEqual(FileUtils.getExtensionsForLanguage("unknown"), []);
  });

  test("validateUserConfiguration identifies valid and invalid entries", () => {
    const config = createMockConfigManager({
      languages: ["css", "", "typescript"],
      globs: ["*.css", "", "*.tsx"],
    });
    const result = FileUtils.validateUserConfiguration(config);
    assert.strictEqual(result.validLanguages.length, 2);
    assert.strictEqual(result.invalidLanguages.length, 1);
    assert.strictEqual(result.validGlobs.length, 2);
    assert.strictEqual(result.invalidGlobs.length, 1);
  });
});
