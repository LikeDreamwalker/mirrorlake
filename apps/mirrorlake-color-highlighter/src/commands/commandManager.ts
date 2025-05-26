import * as vscode from "vscode";
import type { ColorDecorationManager } from "../decorations/colorDecorationManager";
import type { WebViewManager } from "../webview/webViewManager";
import type { ConfigurationManager } from "../config/configurationManager";

export class CommandManager {
  constructor(
    private decorationManager: ColorDecorationManager,
    private webViewManager: WebViewManager,
    private configManager: ConfigurationManager
  ) {}

  registerCommands(context: vscode.ExtensionContext): void {
    // Toggle highlighting command
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "mirrorlake-color-highlighter.toggleHighlighting",
        this.handleToggleHighlighting.bind(this)
      )
    );

    // Replace color command
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "mirrorlake-color-highlighter.replaceColor",
        this.handleReplaceColor.bind(this)
      )
    );

    // WebView command
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "mirrorlake-color-highlighter.openColorInWebView",
        this.handleOpenColorInWebView.bind(this)
      )
    );
  }

  private async handleToggleHighlighting(): Promise<void> {
    await this.configManager.toggleHighlighting();

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      if (this.configManager.isEnabled()) {
        this.decorationManager.updateColorDecorations(editor);
      } else {
        this.decorationManager.clearAllDecorations(editor);
      }
    }
  }

  private async handleReplaceColor(args: any): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !args?.value) {
      return;
    }

    await editor.edit((editBuilder) => {
      const range = args.range
        ? new vscode.Range(
            new vscode.Position(
              args.range.start.line,
              args.range.start.character
            ),
            new vscode.Position(args.range.end.line, args.range.end.character)
          )
        : editor.selection;
      editBuilder.replace(range, args.value);
    });
  }

  private handleOpenColorInWebView(args: any): void {
    this.webViewManager.openColorInWebView(args);
  }
}
