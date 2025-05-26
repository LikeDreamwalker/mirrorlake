import * as vscode from "vscode";
import { CommandManager } from "./commands/commandManager";
import { ColorDecorationManager } from "./decorations/colorDecorationManager";
import { ColorHoverProvider } from "./providers/colorHoverProvider";
import { WebViewManager } from "./webview/webViewManager";
import { ConfigurationManager } from "./config/configurationManager";
import { FileUtils } from "./utils/fileUtils";

let decorationManager: ColorDecorationManager | undefined;

export function activate(context: vscode.ExtensionContext) {
  try {
    // Test if color-tools is available
    const { COLOR_REGEXES } = require("@mirrorlake/color-tools");
    if (!COLOR_REGEXES || COLOR_REGEXES.length === 0) {
      vscode.window.showErrorMessage(
        "MirrorLake Color Highlighter: Invalid color-tools dependency"
      );
      return;
    }

    // Initialize managers
    const configManager = new ConfigurationManager();
    decorationManager = new ColorDecorationManager(configManager);
    const webViewManager = new WebViewManager(context);
    const commandManager = new CommandManager(
      decorationManager,
      webViewManager,
      configManager
    );
    const hoverProvider = new ColorHoverProvider(configManager);

    // Register commands and providers
    commandManager.registerCommands(context);
    context.subscriptions.push(
      vscode.languages.registerHoverProvider("*", hoverProvider)
    );

    // Register event listeners
    registerEventListeners(context, decorationManager, configManager);

    // Initial setup
    configManager.disableBuiltInColorDecorators();

    // Update decorations in the active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && configManager.isEnabled()) {
      decorationManager.updateColorDecorations(activeEditor);
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `MirrorLake Color Highlighter failed to activate: ${error}`
    );
  }
}

function registerEventListeners(
  context: vscode.ExtensionContext,
  decorationManager: ColorDecorationManager,
  configManager: ConfigurationManager
) {
  // Theme change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && configManager.isEnabled()) {
        decorationManager.updateColorDecorations(editor);
      }
    })
  );

  // Editor events
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && configManager.isEnabled()) {
        decorationManager.updateColorDecorations(editor);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (
        editor &&
        event.document === editor.document &&
        configManager.isEnabled()
      ) {
        decorationManager.updateColorDecorations(editor);
      }
    })
  );

  // Configuration change listener
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("mirrorlake-color-highlighter")) {
        // Validate new configuration
        const validation = FileUtils.validateUserConfiguration(configManager);
        if (
          validation.invalidLanguages.length > 0 ||
          validation.invalidGlobs.length > 0
        ) {
          vscode.window.showWarningMessage(
            `MirrorLake Color Highlighter: Invalid configuration detected. Check console for details.`
          );
        }

        const editor = vscode.window.activeTextEditor;
        if (editor && configManager.isEnabled()) {
          decorationManager.updateColorDecorations(editor);
        }
      }
    })
  );
}

export function deactivate() {
  // Clean up decoration manager
  if (decorationManager) {
    decorationManager.dispose();
  }

  // Re-enable VSCode's built-in color decorators when our extension is deactivated
  vscode.workspace
    .getConfiguration()
    .update("editor.colorDecorators", true, vscode.ConfigurationTarget.Global);

  if (vscode.window.activeTextEditor) {
    const configManager = new ConfigurationManager();
    const tempDecorationManager = new ColorDecorationManager(configManager);
    tempDecorationManager.clearAllDecorations(vscode.window.activeTextEditor);
  }
}
