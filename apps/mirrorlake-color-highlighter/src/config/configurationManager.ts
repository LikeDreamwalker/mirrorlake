import * as vscode from "vscode";

export class ConfigurationManager {
  private enabled = true;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async toggleHighlighting(): Promise<void> {
    this.enabled = !this.enabled;
    await vscode.workspace
      .getConfiguration()
      .update(
        "editor.colorDecorators",
        !this.enabled,
        vscode.ConfigurationTarget.Global
      );

    vscode.window.showInformationMessage(
      `MirrorLake Color highlighting: ${this.enabled ? "Enabled" : "Disabled"}`
    );
  }

  getSupportedFileGlobs(): string[] {
    return vscode.workspace
      .getConfiguration("mirrorlake-color-highlighter")
      .get<string[]>("supportedFileGlobs", []);
  }

  getSupportedLanguages(): string[] {
    return vscode.workspace
      .getConfiguration("mirrorlake-color-highlighter")
      .get<string[]>("supportedLanguages", []);
  }

  isNamedColorEnabled(): boolean {
    return vscode.workspace
      .getConfiguration("mirrorlake-color-highlighter")
      .get<boolean>("enableNamedColors", false);
  }

  isRgb4Enabled(): boolean {
    return vscode.workspace
      .getConfiguration("mirrorlake-color-highlighter")
      .get<boolean>("enableRgb4Colors", false);
  }

  async disableBuiltInColorDecorators(): Promise<void> {
    await vscode.workspace
      .getConfiguration()
      .update(
        "editor.colorDecorators",
        false,
        vscode.ConfigurationTarget.Global
      );
  }

  async enableBuiltInColorDecorators(): Promise<void> {
    await vscode.workspace
      .getConfiguration()
      .update(
        "editor.colorDecorators",
        true,
        vscode.ConfigurationTarget.Global
      );
  }
}
