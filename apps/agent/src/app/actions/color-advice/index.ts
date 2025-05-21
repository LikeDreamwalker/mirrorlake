"use server";

import { colord } from "colord";
import type { ColorAdviceResponse } from "./types";
import { getRandomItem, formatTemplate } from "./utils";
import { INTRO_PHRASES, CONCLUSION_PHRASES } from "./constants";
import { simulateColorBlindness } from "@/lib/color-tools";
import { fetchAdvancedColorData } from "./advance-advice";
import { colorToName } from "../color"; // Import from parent directory
import { setupColord } from "./setup";

// Initialize colord with plugins
setupColord();

// Base URL configuration for API requests
const BASE_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV == null ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;

/**
 * Helper function to wrap color codes in ColorPreview tags inside code blocks
 */
function formatColorCode(hexColor: string): string {
  return `\`<ColorPreview>${hexColor}</ColorPreview>\``;
}

/**
 * Main server action to get comprehensive color advice
 */
export async function getColorAdvice(
  hexColor: string
): Promise<ColorAdviceResponse> {
  try {
    // Normalize the hex color (ensure it has a # prefix)
    if (!hexColor.startsWith("#")) {
      hexColor = `#${hexColor}`;
    }

    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      return {
        advice: "",
        error: true,
        message:
          "Invalid hex color format. Please provide a color in the format #RRGGBB.",
      };
    }

    // Create a colord instance
    const c = colord(hexColor);

    // Get color formats
    const rgb = c.toRgb();
    const hsl = c.toHsl();
    const cmyk = c.toCmyk();
    const hsv = c.toHsv();

    // Get color name using the existing function
    const colorName = await colorToName(hexColor);

    // Get color harmonies
    const complementary = c.harmonies("complementary")[1].toHex();
    const analogous = c
      .harmonies("analogous")
      .slice(1)
      .map((color) => color.toHex());
    const triadic = c
      .harmonies("triadic")
      .slice(1)
      .map((color) => color.toHex());
    const tetradic = c
      .harmonies("tetradic")
      .slice(1)
      .map((color) => color.toHex());

    // Get monochromatic variations
    const monochromatic = [
      c.lighten(0.2).toHex(),
      c.lighten(0.1).toHex(),
      c.darken(0.1).toHex(),
      c.darken(0.2).toHex(),
    ];

    // Get accessibility information
    const whiteContrast = c.contrast("#FFFFFF");
    const blackContrast = c.contrast("#000000");
    const betterText = whiteContrast > blackContrast ? "white" : "black";
    const betterTextHex = betterText === "white" ? "#FFFFFF" : "#000000";
    const contrastValue = Math.max(whiteContrast, blackContrast);

    let contrastLevel = "poor";
    if (contrastValue >= 7) contrastLevel = "excellent";
    else if (contrastValue >= 4.5) contrastLevel = "good";
    else if (contrastValue >= 3) contrastLevel = "moderate";

    // Get color blindness simulation
    const colorBlindness = simulateColorBlindness(hexColor);

    // Get random introduction and conclusion
    const introTemplate = getRandomItem(INTRO_PHRASES);
    const conclusionTemplate = getRandomItem(CONCLUSION_PHRASES);

    // Format the templates with actual values
    const intro = formatTemplate(introTemplate, {
      color: hexColor,
      name: colorName,
    });
    const conclusion = formatTemplate(conclusionTemplate, {
      color: hexColor,
      name: colorName,
    });

    // Fetch advanced color analysis from Python API
    const advancedData = await fetchAdvancedColorData(hexColor, BASE_URL);

    // Generate the response in markdown format with smaller headings and more tables
    // Using our new format for color codes
    const advice = `
${intro}

---

### Color Information: ${formatColorCode(hexColor)} (${colorName})

| Property | Value |
|----------|-------|
| Name | ${colorName} |
| Luminance | ${c.luminance().toFixed(2)} |
| Perceived Brightness | ${c.brightness().toFixed(2)} |
| Is Dark | ${c.isDark() ? "Yes" : "No"} |

#### Color Values

| Format | Value |
|--------|-------|
| HEX | ${formatColorCode(c.toHex().toUpperCase())} |
| RGB | rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) |
| HSL | hsl(${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(
      hsl.l
    )}%) |
| HSV | hsv(${Math.round(hsv.h)}°, ${Math.round(hsv.s)}%, ${Math.round(
      hsv.v
    )}%) |
| CMYK | cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(
      cmyk.y
    )}%, ${Math.round(cmyk.k)}%) |

#### Color Harmonies

| Harmony Type | Colors |
|-------------|--------|
| Complementary | ${formatColorCode(complementary)} |
| Analogous | ${formatColorCode(analogous[0])} ${formatColorCode(
      analogous[1]
    )} |
| Triadic | ${formatColorCode(triadic[0])} ${formatColorCode(triadic[1])} |
| Tetradic | ${formatColorCode(tetradic[0])} ${formatColorCode(
      tetradic[1]
    )} ${formatColorCode(tetradic[2])} |
| Monochromatic | ${formatColorCode(monochromatic[0])} ${formatColorCode(
      monochromatic[1]
    )} ${formatColorCode(monochromatic[2])} ${formatColorCode(
      monochromatic[3]
    )} |

#### Accessibility

| Metric | Value |
|--------|-------|
| Best text color | ${betterText} (${formatColorCode(betterTextHex)}) |
| Contrast with white | ${whiteContrast.toFixed(2)}:1 |
| Contrast with black | ${blackContrast.toFixed(2)}:1 |
| WCAG compliance | ${
      contrastValue >= 7
        ? "AA & AAA (all text)"
        : contrastValue >= 4.5
        ? "AA (all text)"
        : contrastValue >= 3
        ? "AA (large text only)"
        : "Not compliant"
    } |

#### Color Blindness Simulation

| Type | Appearance |
|------|------------|
| Protanopia (red-blind) | ${formatColorCode(colorBlindness.protanopia)} |
| Deuteranopia (green-blind) | ${formatColorCode(colorBlindness.deuteranopia)} |
| Tritanopia (blue-blind) | ${formatColorCode(colorBlindness.tritanopia)} |

#### Tints and Shades

| Type | Colors |
|------|--------|
| Tints (Lighter) | ${formatColorCode(
      c.lighten(0.8).toHex()
    )} ${formatColorCode(c.lighten(0.6).toHex())} ${formatColorCode(
      c.lighten(0.4).toHex()
    )} ${formatColorCode(c.lighten(0.2).toHex())} |
| Shades (Darker) | ${formatColorCode(c.darken(0.2).toHex())} ${formatColorCode(
      c.darken(0.4).toHex()
    )} ${formatColorCode(c.darken(0.6).toHex())} ${formatColorCode(
      c.darken(0.8).toHex()
    )} |

${
  advancedData.hasOwnProperty("palette")
    ? `
#### Palette

${advancedData.palette
  ?.map((color: string) => formatColorCode(color))
  .join(" ")}

---

`
    : ""
}

${conclusion}
`;

    return {
      advice,
      ...advancedData,
    };
  } catch (error) {
    console.error("Error generating color advice:", error);
    return {
      advice: "",
      error: true,
      message:
        error instanceof Error ? error.message : "Failed to get color advice",
    };
  }
}
