import * as vscode from "vscode";

// Create decoration types for color highlights
let colorDecorationType: vscode.TextEditorDecorationType;
let isEnabled = true;

export function activate(context: vscode.ExtensionContext) {
  console.log("Color highlighter extension is now active!");

  colorDecorationType = vscode.window.createTextEditorDecorationType({
    before: {
      contentText: "\u2009▰\u2009", // Unicode circle
      fontWeight: "900",
      // width: "1em",
      backgroundColor: "rgba(128, 128, 128, 0.10)", // Subtle background for the code
    },
    fontStyle: "italic",
    // letterSpacing: "1px",
    backgroundColor: "rgba(128, 128, 128, 0.10)", // Subtle background for the code
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    after: {
      contentText: "\u2009\u2009", // Unicode circle
      // fontWeight: "900",
      // width: "1em",
      backgroundColor: "rgba(128, 128, 128, 0.10)", // Subtle background for the code
    },
  });

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
            editor.setDecorations(colorDecorationType, []);
          }
        }
      }
    )
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
    vscode.languages.registerHoverProvider(
      [
        "css",
        "scss",
        "less",
        "javascript",
        "typescript",
        "html",
        "javascriptreact",
        "typescriptreact",
      ],
      {
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
      }
    )
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
  content.supportHtml = true;

  // Add color preview with border
  content.appendMarkdown(
    `<div style="background-color: ${color}; width: 100px; height: 50px; border-radius: 4px; margin-bottom: 10px; border: 1px solid rgba(128, 128, 128, 0.3);"></div>\n\n`
  );
  content.appendMarkdown(`**MirrorLake Color**\n\n`);
  content.appendMarkdown(`**Color:** ${color}\n\n`);

  // Add link to open in WebView
  content.appendMarkdown(
    `[Open in Color Editor](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(
      JSON.stringify({ color })
    )})`
  );

  return new vscode.Hover(content, range);
}

function updateColorDecorations(editor: vscode.TextEditor) {
  const text = editor.document.getText();
  const decorations: vscode.DecorationOptions[] = [];

  // Match hex colors (#fff or #ffffff)
  const hexColorRegex = /#([0-9A-Fa-f]{3}){1,2}\b/g;
  let match;
  while ((match = hexColorRegex.exec(text)) !== null) {
    const startPos = editor.document.positionAt(match.index);
    const endPos = editor.document.positionAt(match.index + match[0].length);
    decorations.push({
      range: new vscode.Range(startPos, endPos),
      renderOptions: {
        before: {
          color: match[0], // Color the square
        },
      },
    });
  }

  // Match rgb/rgba/hsl/hsla colors
  const rgbColorRegex = /rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)/gi;
  const rgbaColorRegex =
    /rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)/gi;
  const hslColorRegex = /hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)/gi;
  const hslaColorRegex =
    /hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\)/gi;

  for (const regex of [
    rgbColorRegex,
    rgbaColorRegex,
    hslColorRegex,
    hslaColorRegex,
  ]) {
    while ((match = regex.exec(text)) !== null) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);
      decorations.push({
        range: new vscode.Range(startPos, endPos),
        renderOptions: {
          before: {
            color: match[0],
          },
        },
      });
    }
  }

  editor.setDecorations(colorDecorationType, decorations);
}

export function deactivate() {
  // Re-enable VSCode's built-in color decorators when our extension is deactivated
  vscode.workspace
    .getConfiguration()
    .update("editor.colorDecorators", true, vscode.ConfigurationTarget.Global);

  if (colorDecorationType) {
    colorDecorationType.dispose();
  }
}
