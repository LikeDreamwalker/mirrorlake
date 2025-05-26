import * as vscode from "vscode";
import { COLOR_REGEXES, nameToColor } from "@mirrorlake/color-tools";
import type { ConfigurationManager } from "../config/configurationManager";

export class ColorDetector {
  detectColors(
    text: string,
    document: vscode.TextDocument,
    configManager: ConfigurationManager
  ): Record<string, vscode.Range[]> {
    const colorRanges: Record<string, vscode.Range[]> = {};
    const allRanges: vscode.Range[] = [];

    for (const { format, regex } of COLOR_REGEXES) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const color = match[0];

        // Only highlight named colors if they are valid CSS color names
        if (format === "named") {
          if (!configManager.isNamedColorEnabled()) {
            continue;
          }
          if (!nameToColor(color, true)) {
            continue;
          }
        }

        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + color.length);
        const range = new vscode.Range(startPos, endPos);

        // Skip if overlaps with any already-highlighted range
        if (this.rangeOverlaps(allRanges, range)) {
          continue;
        }

        if (!colorRanges[color]) {
          colorRanges[color] = [];
        }
        colorRanges[color].push(range);
        allRanges.push(range);
      }
    }

    return colorRanges;
  }

  private rangeOverlaps(
    existing: vscode.Range[],
    candidate: vscode.Range
  ): boolean {
    return existing.some((r) => candidate.intersection(r) !== undefined);
  }
}
