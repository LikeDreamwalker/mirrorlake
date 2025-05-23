import * as vscode from "vscode";
import {
  COLOR_REGEXES,
  parseAndNormalizeColor,
  buildColorWithAlpha,
  nameToColor,
  calculateAnalogous,
  calculateComplementary,
  getColorName,
  hexToHsl,
  hexToRgb,
  getColorAttributes,
  getColorTints,
  getContrastRatio,
  simulateColorBlindness,
  getAlphaFromColorString,
  toHsl4String,
} from "@mirrorlake/color-tools";

let dynamicDecorationTypes: vscode.TextEditorDecorationType[] = [];
let isEnabled = true;

export function activate(context: vscode.ExtensionContext) {
  console.log("Color highlighter extension is now active!");

  // Toggle highlighting command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mirrorlake-color-highlighter.toggleHighlighting",
      async () => {
        isEnabled = !isEnabled;
        await vscode.workspace
          .getConfiguration()
          .update(
            "editor.colorDecorators",
            !isEnabled,
            vscode.ConfigurationTarget.Global
          );
        vscode.window.showInformationMessage(
          `MirrorLake Color highlighting: ${isEnabled ? "Enabled" : "Disabled"}`
        );
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          if (isEnabled) {
            updateColorDecorations(editor);
          } else {
            clearAllDecorations(editor);
          }
        }
      }
    )
  );

  // Replace color command (for clickable hover links)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mirrorlake-color-highlighter.replaceColor",
      async (args) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !args?.value) {
          return;
        }
        await editor.edit((editBuilder) => {
          // Use the range if provided, otherwise replace selection
          const range = args.range
            ? new vscode.Range(
                new vscode.Position(
                  args.range.start.line,
                  args.range.start.character
                ),
                new vscode.Position(
                  args.range.end.line,
                  args.range.end.character
                )
              )
            : editor.selection;
          editBuilder.replace(range, args.value);
        });
      }
    )
  );

  // Theme change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && isEnabled) {
        updateColorDecorations(editor);
      }
    })
  );

  // Editor events
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && isEnabled) {
        updateColorDecorations(editor);
      }
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document && isEnabled) {
        updateColorDecorations(editor);
      }
    })
  );

  // Hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("*", {
      provideHover(document, position, token) {
        for (const { regex } of COLOR_REGEXES) {
          const range = document.getWordRangeAtPosition(position, regex);
          if (range) {
            const color = document.getText(range);
            return createColorHover(color, range);
          }
        }
        return null;
      },
    })
  );

  // WebView command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mirrorlake-color-highlighter.openColorInWebView",
      (args) => {
        const panel = vscode.window.createWebviewPanel(
          "colorAgent",
          `MirrorLake Color: ${args.color}`,
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );
        panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MirrorLake Color</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0; 
              padding: 0;
              background-color: #1e1e1e;
              color: #e0e0e0;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .color-card {
              background-color: #252525;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              margin-bottom: 20px;
            }
            .color-preview { 
              width: 100%; 
              height: 200px; 
              background-color: ${args.color}; 
            }
            .color-info {
              padding: 20px;
            }
            h1 { 
              margin-top: 0;
              font-size: 24px;
              font-weight: 500;
            }
            .color-value {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              background-color: #333;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 14px;
            }
            .color-formats {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 10px;
              margin-top: 20px;
            }
            .format-card {
              background-color: #333;
              padding: 10px;
              border-radius: 4px;
            }
            .format-name {
              font-size: 12px;
              color: #aaa;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>MirrorLake Color</h1>
            <div class="color-card">
              <div class="color-preview"></div>
              <div class="color-info">
                <h2>Color: <span class="color-value">${args.color}</span></h2>
                <div class="color-formats">
                  <div class="format-card">
                    <div class="format-name">HEX</div>
                    <div class="color-value">${args.color}</div>
                  </div>
                  <div class="format-card">
                    <div class="format-name">RGB</div>
                    <div class="color-value">rgb(---, ---, ---)</div>
                  </div>
                  <div class="format-card">
                    <div class="format-name">HSL</div>
                    <div class="color-value">hsl(---, ---%, ---%)</div>
                  </div>
                </div>
              </div>
            </div>
            <p>This is a placeholder for the MirrorLake Color WebView.</p>
            <p>In the future, this will connect to your Next.js color agent app.</p>
          </div>
        </body>
        </html>
      `;
      }
    )
  );

  // Disable VSCode's built-in color decorators by default
  vscode.workspace
    .getConfiguration()
    .update("editor.colorDecorators", false, vscode.ConfigurationTarget.Global);

  // Update decorations in the active editor
  if (vscode.window.activeTextEditor && isEnabled) {
    updateColorDecorations(vscode.window.activeTextEditor);
  }
}

async function createColorHover(
  color: string,
  range: vscode.Range
): Promise<vscode.Hover> {
  const content = new vscode.MarkdownString();
  content.isTrusted = true;

  // Parse and normalize color (get all formats)
  const parsedHex = await parseAndNormalizeColor(color, "hex");
  const parsedRgb = await parseAndNormalizeColor(color, "rgb");
  const parsedHsl = await parseAndNormalizeColor(color, "hsl");
  const parsedHsl4 = await parseAndNormalizeColor(color, "hsl"); // We'll format hsl4 below

  if (!parsedHex.valid) {
    content.appendMarkdown(`**Invalid color:** \`${color}\``);
    return new vscode.Hover(content, range);
  }

  // Get color info
  const hex = parsedHex.normalized.toUpperCase();
  const rgbObj = hexToRgb(hex);
  const rgb = parsedRgb.normalized;
  const hslObj = hexToHsl(hex);
  const hsl = parsedHsl.normalized;

  // Always generate HSL4 string from parsed values
  const hsl4 = toHsl4String(
    Math.round(hslObj.h),
    Math.round(hslObj.s * 100) / 100,
    Math.round(hslObj.l * 100) / 100,
    rgbObj.a
  );
  const colorName = (await getColorName(hex)) || "Unknown";

  const rangeObj = {
    start: { line: range.start.line, character: range.start.character },
    end: { line: range.end.line, character: range.end.character },
  };

  // Swatch + name
  content.appendMarkdown(
    `![](https://singlecolorimage.com/get/${hex.replace("#", "").slice(0, 6)}/16x16) **${colorName}**\n\n`
  );

  // Clickable conversions
  content.appendMarkdown(
    `[HEX: *\`${hex}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: hex, range: rangeObj }))})   ` +
      `[RGB: *\`${rgb}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: rgb, range: rangeObj }))})   ` +
      "\n\n" +
      `[HSL: *\`${hsl}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: hsl, range: rangeObj }))})   ` +
      `[HSL4: *\`${hsl4}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: hsl4, range: rangeObj }))})` +
      `\n\n`
  );

  // More info link
  content.appendMarkdown(
    `[More on MirrorLake](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: hex }))})`
  );

  return new vscode.Hover(content, range);
}

function clearAllDecorations(editor: vscode.TextEditor) {
  for (const deco of dynamicDecorationTypes) {
    editor.setDecorations(deco, []);
    deco.dispose();
  }
  dynamicDecorationTypes = [];
}

async function updateColorDecorations(editor: vscode.TextEditor) {
  const text = editor.document.getText();

  clearAllDecorations(editor);

  // Tailwind theme backgrounds, borders, and foregrounds
  const lightBg = "hsl(240, 4.8%, 95.9%)";
  const darkBg = "hsl(240, 3.7%, 15.9%)";
  const lightFg = "hsl(240, 5.9%, 10%)";
  const darkFg = "hsl(0, 0%, 98%)";
  const lightBorder = "hsl(240, 5.9%, 90%)";
  const darkBorder = "hsl(240, 3.7%, 15.9%)";

  // Detect user's current theme
  const isEditorDark =
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
  const borderColor = isEditorDark ? darkBorder : lightBorder;
  const fg = isEditorDark ? darkFg : lightFg;

  const colorRanges: Record<string, vscode.Range[]> = {};

  for (const { format, regex } of COLOR_REGEXES) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const color = match[0];

      // Only highlight named colors if they are valid CSS color names
      if (format === "named" && !nameToColor(color, true)) {
        continue;
      }

      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + color.length);
      const range = new vscode.Range(startPos, endPos);

      if (!colorRanges[color]) {
        colorRanges[color] = [];
      }
      colorRanges[color].push(range);
    }
  }

  for (const color in colorRanges) {
    // Use color-tools to parse and normalize the color
    const parsed = await parseAndNormalizeColor(color, "hex");
    // Get alpha from color (default 1)
    let colorAlpha = 1;
    if (parsed.valid) {
      // Try to get alpha from hex, rgb, hsl, hsl4, etc.
      if (parsed.format === "hexa") {
        colorAlpha = parseInt(color.slice(-2), 16) / 255;
      } else if (
        parsed.format === "rgba" ||
        parsed.format === "hsla" ||
        parsed.format === "hsl4"
      ) {
        colorAlpha = getAlphaFromColorString(color);
      }
    }
    // Multiply by default opacity
    const defaultOpacity = 0.3;
    const finalOpacity = colorAlpha * defaultOpacity;

    const backgroundColor = parsed.valid
      ? buildColorWithAlpha(parsed.normalized, finalOpacity)
      : undefined;

    const decoType = vscode.window.createTextEditorDecorationType({
      backgroundColor: backgroundColor,
      borderRadius: "0px 999px 999px 0px",
      borderColor: borderColor,
      borderStyle: "solid",
      borderWidth: "1px 1px 1px 0px",
      color: fg,
      before: {
        height: "100%",
        backgroundColor: backgroundColor,
        color: parsed.valid ? parsed.normalized : color,
        contentText: "\u2009■\u2009",
        border: `1px solid ${borderColor}`,
      },
    });
    dynamicDecorationTypes.push(decoType);
    editor.setDecorations(decoType, colorRanges[color]);
  }
}

export function deactivate() {
  // Re-enable VSCode's built-in color decorators when our extension is deactivated
  vscode.workspace
    .getConfiguration()
    .update("editor.colorDecorators", true, vscode.ConfigurationTarget.Global);

  if (vscode.window.activeTextEditor) {
    clearAllDecorations(vscode.window.activeTextEditor);
  }
}
