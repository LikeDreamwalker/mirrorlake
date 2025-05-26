import * as vscode from "vscode";
import { ColorDetector } from "../utils/colorDetector";
import { ThemeUtils } from "../utils/themeUtils";
import { FileUtils } from "../utils/fileUtils";
import type { ConfigurationManager } from "../config/configurationManager";
import {
  parseAndNormalizeColor,
  buildColorWithAlpha,
  getAlphaFromColorString,
} from "@mirrorlake/color-tools";

export class ColorDecorationManager {
  private dynamicDecorationTypes: vscode.TextEditorDecorationType[] = [];
  private colorDetector = new ColorDetector();

  constructor(private configManager: ConfigurationManager) {}

  clearAllDecorations(editor: vscode.TextEditor): void {
    for (const deco of this.dynamicDecorationTypes) {
      editor.setDecorations(deco, []);
      deco.dispose();
    }
    this.dynamicDecorationTypes = [];
  }

  async updateColorDecorations(editor: vscode.TextEditor): Promise<void> {
    if (!FileUtils.isSupportedFile(editor.document, this.configManager)) {
      return;
    }

    const text = editor.document.getText();
    this.clearAllDecorations(editor);

    const { borderColor, fg } = ThemeUtils.getThemeColors();
    const colorRanges = this.colorDetector.detectColors(
      text,
      editor.document,
      this.configManager
    );

    for (const color in colorRanges) {
      const backgroundColor = await this.getBackgroundColor(color);
      const decoType = this.createDecorationType(
        backgroundColor,
        borderColor,
        fg,
        color
      );

      this.dynamicDecorationTypes.push(decoType);
      editor.setDecorations(decoType, colorRanges[color]);
    }
  }

  private async getBackgroundColor(color: string): Promise<string | undefined> {
    const parsed = await parseAndNormalizeColor(color, "hex");
    if (!parsed.valid) {
      return undefined;
    }

    let colorAlpha = 1;
    if (parsed.format === "hexa") {
      colorAlpha = Number.parseInt(color.slice(-2), 16) / 255;
    } else if (
      parsed.format === "rgba" ||
      parsed.format === "hsla" ||
      parsed.format === "hsl4"
    ) {
      colorAlpha = getAlphaFromColorString(color);
    }

    const defaultOpacity = 0.3;
    const finalOpacity = colorAlpha * defaultOpacity;

    return buildColorWithAlpha(parsed.normalized, finalOpacity);
  }

  private createDecorationType(
    backgroundColor: string | undefined,
    borderColor: string,
    fg: string,
    color: string
  ): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: backgroundColor,
      borderRadius: "0px 999px 999px 0px",
      borderColor: borderColor,
      borderStyle: "solid",
      borderWidth: "1px 1px 1px 0px",
      color: fg,
      before: {
        height: "100%",
        backgroundColor: backgroundColor,
        color: backgroundColor ? color : color,
        contentText: "\u2009■\u2009",
        border: `1px solid ${borderColor}`,
      },
    });
  }
}
