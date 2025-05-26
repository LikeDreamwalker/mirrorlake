import * as vscode from "vscode";
import { minimatch } from "minimatch";
import {
  COLOR_REGEXES,
  parseAndNormalizeColor,
  buildColorWithAlpha,
  nameToColor,
  getColorName,
  hexToHsl,
  hexToRgb,
  getAlphaFromColorString,
  toHsl4String,
} from "@mirrorlake/color-tools";

let dynamicDecorationTypes: vscode.TextEditorDecorationType[] = [];
let isEnabled = true;
let mirrorLakePanel: vscode.WebviewPanel | undefined = undefined;

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
        for (const { format, regex } of COLOR_REGEXES) {
          let match;
          while ((match = regex.exec(document.getText())) !== null) {
            let color = match[0];
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + color.length);
            const range = new vscode.Range(startPos, endPos);
            // Only highlight named colors if they are valid CSS color names
            if (format === "named" && isNamedColorEnabled()) {
              const namedColor = nameToColor(color, true);
              if (namedColor) {
                color = namedColor;
              } else {
                continue;
              }
            }
            if (
              position.line >= range.start.line &&
              position.line <= range.end.line &&
              position.character >= range.start.character &&
              position.character <= range.end.character
            ) {
              return createColorHover(color, range);
            }
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
        if (mirrorLakePanel) {
          mirrorLakePanel.reveal(vscode.ViewColumn.Beside);
          // Also send update if panel already exists
          mirrorLakePanel.webview.postMessage({
            type: "update",
            color: args.color,
          });
          return;
        }
        mirrorLakePanel = vscode.window.createWebviewPanel(
          "colorAgent",
          `MirrorLake Color: ${args.color}`,
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );
        mirrorLakePanel.webview.html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>MirrorLake Color</title>
              <style>
                html, body { height: 100%; margin: 0; padding: 0; }
                iframe { width: 100vw; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe
                id="mirrorlake-iframe"
                src="https://mirrorlake.ldwid.com?color=${encodeURIComponent(args.color)}"
                sandbox="allow-scripts allow-same-origin allow-forms"
              ></iframe>
              <script>
                window.vscodeApi = acquireVsCodeApi();
              </script>
              <script>
                // Listen for VSCode postMessage and forward to iframe
                window.addEventListener('message', (event) => {
                  const iframe = document.getElementById('mirrorlake-iframe');
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(event.data, '*');
                  }
                });
              </script>
              <script>
                window.addEventListener('message', (event) => {
                  const data = event.data;
                  if (data && data.type === "copy-to-clipboard") {
                    // Forward to VS Code extension host
                    window.vscodeApi?.postMessage(data);
                  }
                });
              </script>
            </body>
          </html>
        `;
        mirrorLakePanel.webview.onDidReceiveMessage((message) => {
          if (message.type === "copy-to-clipboard" && message.text) {
            vscode.env.clipboard.writeText(message.text);
            vscode.window.showInformationMessage(`Copied: ${message.text}`);
          }
        });
        mirrorLakePanel.onDidDispose(
          () => {
            mirrorLakePanel = undefined;
          },
          null,
          context.subscriptions
        );
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
  const hsl = `hsl(${Math.round(hslObj.h)}, ${Math.round(hslObj.s)}%, ${Math.round(hslObj.l)}%)`;
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
  if (!isSupportedFile(editor.document)) {
    return;
  }

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
  const allRanges: vscode.Range[] = [];

  for (const { format, regex } of COLOR_REGEXES) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const color = match[0];

      // Only highlight named colors if they are valid CSS color names
      if (format === "named") {
        if (!isNamedColorEnabled()) {
          continue;
        }
        if (!nameToColor(color, true)) {
          continue;
        }
      }
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + color.length);
      const range = new vscode.Range(startPos, endPos);

      // Skip if overlaps with any already-highlighted range
      if (rangeOverlaps(allRanges, range)) {
        continue;
      }

      if (!colorRanges[color]) {
        colorRanges[color] = [];
      }
      colorRanges[color].push(range);
      allRanges.push(range);
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

function rangeOverlaps(
  existing: vscode.Range[],
  candidate: vscode.Range
): boolean {
  return existing.some((r) => candidate.intersection(r) !== undefined);
}

function isSupportedFile(document: vscode.TextDocument): boolean {
  const globs: string[] = vscode.workspace
    .getConfiguration("mirrorlake-color-highlighter")
    .get("supportedFileGlobs", []);
  const fileName = document.fileName.split(/[/\\]/).pop() || "";
  return globs.some((glob) => minimatch(fileName, glob));
}

function isNamedColorEnabled(): boolean {
  return vscode.workspace
    .getConfiguration("mirrorlake-color-highlighter")
    .get<boolean>("enableNamedColors", false);
}
