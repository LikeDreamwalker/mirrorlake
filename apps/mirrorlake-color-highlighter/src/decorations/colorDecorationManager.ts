import * as vscode from "vscode";
import { ColorDetector } from "../utils/colorDetector";
import { ThemeUtils } from "../utils/themeUtils";
import { FileUtils } from "../utils/fileUtils";
import type { ConfigurationManager } from "../config/configurationManager";
import {
  parseAndNormalizeColor,
  buildColorWithAlpha,
  getAlphaFromColorString,
  nameToColor,
} from "@mirrorlake/color-tools";

export class ColorDecorationManager {
  private dynamicDecorationTypes: vscode.TextEditorDecorationType[] = [];
  private colorDetector = new ColorDetector();
  private updateTimeout: NodeJS.Timeout | undefined;
  private readonly DEBOUNCE_DELAY = 150; // ms

  constructor(private configManager: ConfigurationManager) {}

  clearAllDecorations(editor: vscode.TextEditor): void {
    for (const deco of this.dynamicDecorationTypes) {
      editor.setDecorations(deco, []);
      deco.dispose();
    }
    this.dynamicDecorationTypes = [];
  }

  async updateColorDecorations(editor: vscode.TextEditor): Promise<void> {
    // Clear existing timeout to debounce rapid updates
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      await this.performUpdate(editor);
    }, this.DEBOUNCE_DELAY);
  }

  private async performUpdate(editor: vscode.TextEditor): Promise<void> {
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
      // Convert named colors to hex for consistent processing
      const processedColor = await this.processColor(color);
      const backgroundColor = await this.getBackgroundColor(processedColor);
      const decoType = this.createDecorationType(
        backgroundColor,
        borderColor,
        fg,
        processedColor
      );

      this.dynamicDecorationTypes.push(decoType);
      editor.setDecorations(decoType, colorRanges[color]);
    }
  }

  private async processColor(color: string): Promise<string> {
    // Check if it's a named color and convert it
    if (this.configManager.isNamedColorEnabled()) {
      const namedColorHex = nameToColor(color, true);
      if (namedColorHex) {
        return namedColorHex;
      }
    }
    return (await parseAndNormalizeColor(color, "hex")).normalized;
  }

  private async getBackgroundColor(color: string): Promise<string | undefined> {
    try {
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
    } catch (error) {
      return undefined;
    }
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
        color: color,
        contentText: "\u2009■\u2009",
        border: `1px solid ${borderColor}`,
      },
    });
  }

  dispose(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
  }
}
