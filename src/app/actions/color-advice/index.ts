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
    const advice = `
${intro}

---

### Color Information: ${hexColor} (${colorName})

| Property | Value |
|----------|-------|
| Name | ${colorName} |
| Luminance | ${c.luminance().toFixed(2)} |
| Perceived Brightness | ${c.brightness().toFixed(2)} |
| Is Dark | ${c.isDark() ? "Yes" : "No"} |

#### Color Values

| Format | Value |
|--------|-------|
| HEX | ${c.toHex().toUpperCase()} |
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
| Complementary | \`${complementary}\` |
| Analogous | \`${analogous[0]}\` \`${analogous[1]}\` |
| Triadic | \`${triadic[0]}\` \`${triadic[1]}\` |
| Tetradic | \`${tetradic[0]}\` \`${tetradic[1]}\` \`${tetradic[2]}\` |
| Monochromatic | \`${monochromatic[0]}\` \`${monochromatic[1]}\` \`${
      monochromatic[2]
    }\` \`${monochromatic[3]}\` |

#### Accessibility

| Metric | Value |
|--------|-------|
| Best text color | ${betterText} (\`${betterTextHex}\`) |
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
| Protanopia (red-blind) | \`${colorBlindness.protanopia}\` |
| Deuteranopia (green-blind) | \`${colorBlindness.deuteranopia}\` |
| Tritanopia (blue-blind) | \`${colorBlindness.tritanopia}\` |

#### Tints and Shades

| Type | Colors |
|------|--------|
| Tints (Lighter) | \`${c.lighten(0.8).toHex()}\` \`${c
      .lighten(0.6)
      .toHex()}\` \`${c.lighten(0.4).toHex()}\` \`${c.lighten(0.2).toHex()}\` |
| Shades (Darker) | \`${c.darken(0.2).toHex()}\` \`${c
      .darken(0.4)
      .toHex()}\` \`${c.darken(0.6).toHex()}\` \`${c.darken(0.8).toHex()}\` |

${
  advancedData.hasOwnProperty("palette")
    ? `
#### Palette

${advancedData.palette?.map((color: string) => `\`${color}\``).join(" ")}

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
