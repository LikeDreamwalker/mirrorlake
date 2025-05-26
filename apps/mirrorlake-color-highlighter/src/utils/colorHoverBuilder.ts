import * as vscode from "vscode";
import {
  parseAndNormalizeColor,
  getColorName,
  hexToHsl,
  hexToRgb,
  toHsl4String,
  getContrastRatio,
  getReadableTextColor,
  isColorDark,
  getColorAttributes,
  calculateComplementary,
  calculateAnalogous,
  getColorTints,
  getColorShades,
  simulateColorBlindness,
} from "@mirrorlake/color-tools";

export class ColorHoverBuilder {
  async createColorHover(
    color: string,
    range: vscode.Range,
    originalColor?: string
  ): Promise<vscode.Hover> {
    const content = new vscode.MarkdownString();
    content.isTrusted = true;

    // Parse and normalize color
    const parsedHex = await parseAndNormalizeColor(color, "hex");

    if (!parsedHex.valid) {
      content.appendMarkdown(
        `**❌ Invalid color:** \`${originalColor || color}\``
      );
      return new vscode.Hover(content, range);
    }

    const colorInfo = await this.getExtendedColorInfo(
      parsedHex.normalized,
      originalColor
    );
    const rangeObj = this.createRangeObject(range);

    // Header with color swatch and name
    this.addColorHeader(content, colorInfo);

    // Color values section
    this.addColorValues(content, colorInfo, rangeObj);

    // Color properties section
    this.addColorProperties(content, colorInfo);

    // Color harmonies section (compact)
    this.addColorHarmonies(content, colorInfo);

    // Accessibility section
    this.addAccessibilityInfo(content, colorInfo);

    // Footer with MirrorLake link
    content.appendMarkdown(
      `\n---\n[**Explore on MirrorLake**](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.hex }))})`
    );

    return new vscode.Hover(content, range);
  }

  private async getExtendedColorInfo(hex: string, originalColor?: string) {
    const rgbObj = hexToRgb(hex);
    const hslObj = hexToHsl(hex);
    const colorName = (await getColorName(hex)) || "Unknown";
    const displayName =
      originalColor && originalColor !== hex ? originalColor : colorName;

    // Get color attributes
    const attributes = getColorAttributes(displayName, hslObj);

    // Get color harmonies
    const complementary = calculateComplementary(hex);
    const analogous = calculateAnalogous(hex);

    // Get tints and shades (just a few)
    const tints = getColorTints(hex, 2);
    const shades = getColorShades(hex, 2);

    // Color blindness simulation
    const colorBlindSim = simulateColorBlindness(hex);

    // Accessibility info
    const isDark = isColorDark(hex);
    const textColor = getReadableTextColor(hex);
    const contrastWithWhite = getContrastRatio(hex, "#FFFFFF");
    const contrastWithBlack = getContrastRatio(hex, "#000000");

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
      colorName: displayName,
      attributes,
      isDark,
      textColor,
      contrastWithWhite: Math.round(contrastWithWhite * 100) / 100,
      contrastWithBlack: Math.round(contrastWithBlack * 100) / 100,
      complementary,
      analogous,
      tints,
      shades,
      colorBlindSim,
      hslObj,
      rgbObj,
    };
  }

  private addColorHeader(content: vscode.MarkdownString, colorInfo: any): void {
    const swatch = `![](https://singlecolorimage.com/get/${colorInfo.hex.replace("#", "").slice(0, 6)}/16x16)`;
    const attributes = colorInfo.attributes.slice(0, 3).join(", ");

    content.appendMarkdown(
      `${swatch} **${colorInfo.colorName}**\n\n` + `*${attributes}*\n\n`
    );
  }

  private addColorValues(
    content: vscode.MarkdownString,
    colorInfo: any,
    rangeObj: any
  ): void {
    content.appendMarkdown(`#### Color Values\n\n`);

    // Make the entire line clickable for color replacement
    const hexLink = `[**HEX** \`${colorInfo.hex}\`](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.hex, range: rangeObj }))})`;
    const rgbLink = `[**RGB** \`${colorInfo.rgb}\`](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.rgb, range: rangeObj }))})`;
    const hslLink = `[**HSL** \`${colorInfo.hsl}\`](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.hsl, range: rangeObj }))})`;
    const hsl4Link = `[**HSL4** \`${colorInfo.hsl4}\`](command:mirrorlake-color-highlighter.replaceColor?${encodeURIComponent(JSON.stringify({ value: colorInfo.hsl4, range: rangeObj }))})`;

    content.appendMarkdown(
      `${hexLink}\n\n` + `${rgbLink}\n\n` + `${hslLink}\n\n` + `${hsl4Link}\n\n`
    );
  }

  private addColorProperties(
    content: vscode.MarkdownString,
    colorInfo: any
  ): void {
    content.appendMarkdown(`#### Properties\n\n`);

    const brightness = colorInfo.isDark ? "Dark" : "Light";
    const saturation = Math.round(colorInfo.hslObj.s);
    const lightness = Math.round(colorInfo.hslObj.l);

    content.appendMarkdown(
      `**Brightness:** ${brightness} • **Saturation:** ${saturation}% • **Lightness:** ${lightness}%\n\n`
    );
  }

  private addColorHarmonies(
    content: vscode.MarkdownString,
    colorInfo: any
  ): void {
    content.appendMarkdown(`#### Color Harmonies\n\n`);

    // Create clickable links that open in MirrorLake webview
    const compSwatch = `![](https://singlecolorimage.com/get/${colorInfo.complementary.replace("#", "").slice(0, 6)}/16x16)`;
    const analog1Swatch = `![](https://singlecolorimage.com/get/${colorInfo.analogous[0].replace("#", "").slice(0, 6)}/16x16)`;
    const analog2Swatch = `![](https://singlecolorimage.com/get/${colorInfo.analogous[1].replace("#", "").slice(0, 6)}/16x16)`;

    const compLink = `[${compSwatch} **Complementary** \`${colorInfo.complementary}\`](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.complementary }))})`;
    const analog1Link = `[${analog1Swatch} **Analogous** \`${colorInfo.analogous[0]}\`](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.analogous[0] }))})`;
    const analog2Link = `[${analog2Swatch} **Analogous** \`${colorInfo.analogous[1]}\`](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.analogous[1] }))})`;

    content.appendMarkdown(
      `${compLink}\n\n` + `${analog1Link}\n\n` + `${analog2Link}\n\n`
    );
  }

  private addAccessibilityInfo(
    content: vscode.MarkdownString,
    colorInfo: any
  ): void {
    content.appendMarkdown(`#### Accessibility\n\n`);

    // Contrast ratios
    const whiteStatus =
      colorInfo.contrastWithWhite >= 4.5
        ? "PASS"
        : colorInfo.contrastWithWhite >= 3
          ? "AA Large"
          : "FAIL";
    const blackStatus =
      colorInfo.contrastWithBlack >= 4.5
        ? "PASS"
        : colorInfo.contrastWithBlack >= 3
          ? "AA Large"
          : "FAIL";

    content.appendMarkdown(
      `**Contrast Ratios:**\n` +
        `• vs White: **${whiteStatus}** (${colorInfo.contrastWithWhite}:1)\n` +
        `• vs Black: **${blackStatus}** (${colorInfo.contrastWithBlack}:1)\n\n` +
        `**Recommended text color:** \`${colorInfo.textColor}\`\n\n`
    );

    // Color blindness simulation (compact) - make these clickable too
    const protanSwatch = `![](https://singlecolorimage.com/get/${colorInfo.colorBlindSim.protanopia.replace("#", "").slice(0, 6)}/12x12)`;
    const deuterSwatch = `![](https://singlecolorimage.com/get/${colorInfo.colorBlindSim.deuteranopia.replace("#", "").slice(0, 6)}/12x12)`;
    const tritanSwatch = `![](https://singlecolorimage.com/get/${colorInfo.colorBlindSim.tritanopia.replace("#", "").slice(0, 6)}/12x12)`;

    const protanLink = `[${protanSwatch} Red-blind](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.colorBlindSim.protanopia }))})`;
    const deuterLink = `[${deuterSwatch} Green-blind](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.colorBlindSim.deuteranopia }))})`;
    const tritanLink = `[${tritanSwatch} Blue-blind](command:mirrorlake-color-highlighter.openColorInWebView?${encodeURIComponent(JSON.stringify({ color: colorInfo.colorBlindSim.tritanopia }))})`;

    content.appendMarkdown(
      `**Color Blindness Simulation:**\n` +
        `${protanLink} • ${deuterLink} • ${tritanLink}\n\n`
    );
  }

  private createRangeObject(range: vscode.Range) {
    return {
      start: { line: range.start.line, character: range.start.character },
      end: { line: range.end.line, character: range.end.character },
    };
  }
}
