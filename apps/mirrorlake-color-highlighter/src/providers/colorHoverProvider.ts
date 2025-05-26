import * as vscode from "vscode";
import { COLOR_REGEXES, nameToColor } from "@mirrorlake/color-tools";
import { ColorHoverBuilder } from "../utils/colorHoverBuilder";
import { ConfigurationManager } from "../config/configurationManager";

export class ColorHoverProvider implements vscode.HoverProvider {
  private configManager = new ConfigurationManager();
  private hoverBuilder = new ColorHoverBuilder();

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    for (const { format, regex } of COLOR_REGEXES) {
      let match;
      while ((match = regex.exec(document.getText())) !== null) {
        let color = match[0];
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + color.length);
        const range = new vscode.Range(startPos, endPos);

        // Only highlight named colors if they are valid CSS color names
        if (format === "named" && this.configManager.isNamedColorEnabled()) {
          const namedColor = nameToColor(color, true);
          if (namedColor) {
            color = namedColor;
          } else {
            continue;
          }
        }

        if (this.isPositionInRange(position, range)) {
          return this.hoverBuilder.createColorHover(color, range);
        }
      }
    }
    return null;
  }

  private isPositionInRange(
    position: vscode.Position,
    range: vscode.Range
  ): boolean {
    return (
      position.line >= range.start.line &&
      position.line <= range.end.line &&
      position.character >= range.start.character &&
      position.character <= range.end.character
    );
  }
}
