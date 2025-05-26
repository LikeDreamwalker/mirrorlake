import * as vscode from "vscode"
import { CommandManager } from "./commands/commandManager"
import { ColorDecorationManager } from "./decorations/colorDecorationManager"
import { ColorHoverProvider } from "./providers/colorHoverProvider"
import { WebViewManager } from "./webview/webViewManager"
import { ConfigurationManager } from "./config/configurationManager"

export function activate(context: vscode.ExtensionContext) {
  console.log("Color highlighter extension is now active!")

  // Initialize managers
  const configManager = new ConfigurationManager()
  const decorationManager = new ColorDecorationManager(configManager)
  const webViewManager = new WebViewManager(context)
  const commandManager = new CommandManager(decorationManager, webViewManager, configManager)
  const hoverProvider = new ColorHoverProvider()

  // Register commands
  commandManager.registerCommands(context)

  // Register providers
  context.subscriptions.push(vscode.languages.registerHoverProvider("*", hoverProvider))

  // Register event listeners
  registerEventListeners(context, decorationManager, configManager)

  // Initial setup
  configManager.disableBuiltInColorDecorators()

  // Update decorations in the active editor
  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor && configManager.isEnabled()) {
    decorationManager.updateColorDecorations(activeEditor)
  }
}

function registerEventListeners(
  context: vscode.ExtensionContext,
  decorationManager: ColorDecorationManager,
  configManager: ConfigurationManager,
) {
  // Theme change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      const editor = vscode.window.activeTextEditor
      if (editor && configManager.isEnabled()) {
        decorationManager.updateColorDecorations(editor)
      }
    }),
  )

  // Editor events
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && configManager.isEnabled()) {
        decorationManager.updateColorDecorations(editor)
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor
      if (editor && event.document === editor.document && configManager.isEnabled()) {
        decorationManager.updateColorDecorations(editor)
      }
    }),
  )
}

export function deactivate() {
  // Re-enable VSCode's built-in color decorators when our extension is deactivated
  vscode.workspace.getConfiguration().update("editor.colorDecorators", true, vscode.ConfigurationTarget.Global)

  if (vscode.window.activeTextEditor) {
    const decorationManager = new ColorDecorationManager(new ConfigurationManager())
    decorationManager.clearAllDecorations(vscode.window.activeTextEditor)
  }
}
