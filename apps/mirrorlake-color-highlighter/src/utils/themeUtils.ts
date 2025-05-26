import * as vscode from "vscode";

export class ThemeUtils {
  static getThemeColors(): { borderColor: string; fg: string } {
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

    return {
      borderColor: isEditorDark ? darkBorder : lightBorder,
      fg: isEditorDark ? darkFg : lightFg,
    };
  }
}
