import * as vscode from "vscode";
import {
  COLOR_REGEXES,
  parseAndNormalizeColor,
  buildColorWithAlpha,
  nameToColor,
} from "@mirrorlake/color-tools";

let dynamicDecorationTypes: vscode.TextEditorDecorationType[] = [];
let isEnabled = true;

export function activate(context: vscode.ExtensionContext) {
  console.log("Color highlighter extension is now active!");

  // Register command to toggle between our extension and VSCode's built-in highlighting
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mirrorlake-color-highlighter.toggleHighlighting",
      async () => {
        isEnabled = !isEnabled;

        // Toggle VSCode's built-in color decorators
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

        // Update decorations in the active editor
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

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && isEnabled) {
        updateColorDecorations(editor);
      }
    })
  );

  // Register event handlers
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

  // Add hover provider for more information
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("*", {
      provideHover(document, position, token) {
        // Check if we're hovering over a color
        const hexRange = document.getWordRangeAtPosition(
          position,
          /#([0-9A-Fa-f]{3}){1,2}\b/
        );
        if (hexRange) {
          const color = document.getText(hexRange);
          return createColorHover(color, hexRange);
        }

        // Check for rgb/rgba colors
        const rgbRange = document.getWordRangeAtPosition(
          position,
          /rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)/
        );
        if (rgbRange) {
          const color = document.getText(rgbRange);
          return createColorHover(color, rgbRange);
        }

        // Check for hsl/hsla colors
        const hslRange = document.getWordRangeAtPosition(
          position,
          /hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\)/
        );
        if (hslRange) {
          const color = document.getText(hslRange);
          return createColorHover(color, hslRange);
        }

        return null;
      },
    })
  );

  // Register command to open color in WebView
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

        // Create a more attractive WebView
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

// Helper function to create color hover
function createColorHover(color: string, range: vscode.Range): vscode.Hover {
  const content = new vscode.MarkdownString();
  content.isTrusted = true;

  // Remove # if present and encode for URL
  const colorParam = encodeURIComponent(color.replace(/^#/, ""));

  // Render your color card image from the API with 2:1 aspect ratio (e.g., 300x150)
  content.appendMarkdown(
    `![Color Card](https://mirrorlake.ldwid.com/api/color-card?color=${colorParam}&width=600&theme=dark)\n\n`
  );
  content.appendMarkdown(`**MirrorLake Color**\n\n`);
  content.appendMarkdown(`**Color:** ${color}\n\n`);

  // Add link to open in Color Editor WebView
  content.appendMarkdown(
    `[Open in Color Editor](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(
      JSON.stringify({ color })
    )})`
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
    // Use color-tools to get the border color with 0.7 opacity
    const backgroundColor = parsed.valid
      ? buildColorWithAlpha(parsed.normalized, 0.1) // adjust opacity as desired
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
