import * as vscode from "vscode";
import {
  parseAndNormalizeColor,
  getColorName,
  hexToHsl,
  hexToRgb,
  toHsl4String,
} from "@mirrorlake/color-tools";

export class ColorHoverBuilder {
  async createColorHover(
    color: string,
    range: vscode.Range
  ): Promise<vscode.Hover> {
    const content = new vscode.MarkdownString();
    content.isTrusted = true;

    // Parse and normalize color (get all formats)
    const parsedHex = await parseAndNormalizeColor(color, "hex");
    const parsedRgb = await parseAndNormalizeColor(color, "rgb");
    const parsedHsl = await parseAndNormalizeColor(color, "hsl");

    if (!parsedHex.valid) {
      content.appendMarkdown(`**Invalid color:** \`${color}\``);
      return new vscode.Hover(content, range);
    }

    const colorInfo = await this.getColorInfo(parsedHex.normalized);
    const rangeObj = this.createRangeObject(range);

    // Swatch + name
    content.appendMarkdown(
      `![](https://singlecolorimage.com/get/${colorInfo.hex.replace("#", "").slice(0, 6)}/16x16) **${colorInfo.colorName}**\n\n`
    );

    // Clickable conversions
    this.addClickableConversions(content, colorInfo, rangeObj);

    // More info link
    content.appendMarkdown(
      `[More on MirrorLake](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.hex }))})`
    );

    return new vscode.Hover(content, range);
  }

  private async getColorInfo(hex: string) {
    const rgbObj = hexToRgb(hex);
    const hslObj = hexToHsl(hex);

    return {
      hex: hex.toUpperCase(),
      rgb: `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`,
      hsl: `hsl(${Math.round(hslObj.h)}, ${Math.round(hslObj.s)}%, ${Math.round(hslObj.l)}%)`,
      hsl4: toHsl4String(
        Math.round(hslObj.h),
        Math.round(hslObj.s * 100) / 100,
        Math.round(hslObj.l * 100) / 100,
        rgbObj.a
      ),
      colorName: (await getColorName(hex)) || "Unknown",
    };
  }

  private createRangeObject(range: vscode.Range) {
    return {
      start: { line: range.start.line, character: range.start.character },
      end: { line: range.end.line, character: range.end.character },
    };
  }

  private addClickableConversions(
    content: vscode.MarkdownString,
    colorInfo: any,
    rangeObj: any
  ): void {
    content.appendMarkdown(
      `[HEX: *\`${colorInfo.hex}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.hex, range: rangeObj }))})   ` +
        `[RGB: *\`${colorInfo.rgb}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.rgb, range: rangeObj }))})   ` +
        "\n\n" +
        `[HSL: *\`${colorInfo.hsl}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.hsl, range: rangeObj }))})   ` +
        `[HSL4: *\`${colorInfo.hsl4}\`*](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.hsl4, range: rangeObj }))})` +
        `\n\n`
    );
  }
}
