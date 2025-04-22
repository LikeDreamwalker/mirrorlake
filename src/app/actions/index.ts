"use server";

import { colord, extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";
import harmoniesPlugin from "colord/plugins/harmonies";
import mixPlugin from "colord/plugins/mix";
import { colorToName } from "./color"; // Import your existing colorToName function

// Extend colord with plugins
extend([cmykPlugin, namesPlugin, a11yPlugin, harmoniesPlugin, mixPlugin]);

// Response type
export type ColorAdviceResponse = {
  advice: string;
  error?: boolean;
  message?: string;
};

// Color attributes by hue range
const COLOR_ATTRIBUTES: Record<string, string[]> = {
  red: ["energetic", "passionate", "attention-grabbing", "bold", "exciting"],
  orange: ["warm", "energetic", "friendly", "playful", "inviting"],
  yellow: ["cheerful", "optimistic", "stimulating", "bright", "sunny"],
  green: ["natural", "fresh", "growth-oriented", "calming", "balanced"],
  cyan: ["calm", "refreshing", "technological", "clean", "modern"],
  blue: ["trustworthy", "calm", "professional", "reliable", "peaceful"],
  purple: ["creative", "luxurious", "mysterious", "royal", "imaginative"],
  magenta: ["innovative", "energetic", "emotional", "romantic", "bold"],
  pink: ["playful", "feminine", "delicate", "romantic", "youthful"],
  brown: ["earthy", "warm", "natural", "reliable", "comforting"],
  gray: ["neutral", "balanced", "conservative", "timeless", "versatile"],
  black: ["elegant", "sophisticated", "formal", "mysterious", "dramatic"],
  white: ["clean", "pure", "minimalist", "airy", "spacious"],
};

// Introduction phrases
const INTRO_PHRASES = [
  "I've analyzed the color {color} ({name}) and found the following information:",
  "Here's what I discovered about the color {color} ({name}):",
  "Let me share some details about the color {color} ({name}):",
  "I've gathered some information about {color} ({name}):",
  "Here's a breakdown of the color {color} ({name}):",
  "I've examined the color {color} ({name}) and here's what I found:",
  "Looking at the color {color} ({name}), I can provide these details:",
  "The color {color} ({name}) has the following properties:",
  "Here's an analysis of the color {color} ({name}):",
  "I've processed the color {color} ({name}) and can tell you the following:",
];

// Conclusion phrases
const CONCLUSION_PHRASES = [
  "Would you like to add this color to your theme? I can also suggest color combinations or provide more specific information about how to use this color effectively in your design.",
  "Would you like to incorporate this color into your theme? I can help with color combinations or provide more detailed usage recommendations.",
  "Should we add this color to your theme? I can also recommend complementary colors or provide more specific design advice.",
  "Would this color work well in your theme? I can suggest palette options or offer more targeted recommendations for using it effectively.",
  "Does this color fit your design needs? I can help you integrate it into a theme or provide more specific guidance on how to use it.",
  "Would you like to use this color in your project? I can recommend color pairings or provide more detailed information about its applications.",
  "Is this a color you'd like to work with? I can suggest harmonious combinations or provide more specific advice for implementing it in your design.",
  "Would you like to explore using this color? I can recommend palette options or provide more targeted advice for your specific design needs.",
  "Does this color appeal to you for your project? I can help with color scheme suggestions or provide more detailed usage recommendations.",
  "Would you like to save this color for your design? I can suggest complementary colors or provide more specific guidance on how to use it effectively.",
  // Additional variations of the specific phrase
  "How would this color fit into your theme? I can offer palette suggestions or provide specific recommendations for using it effectively.",
  "Do you think this color would enhance your theme? I can suggest color combinations or provide targeted advice for implementing it.",
  "Could this color be a good addition to your theme? I can recommend palette options or offer specific guidance for using it effectively.",
  "Might this color work for your project? I can suggest complementary colors or provide tailored recommendations for its use.",
  "Would this color be valuable in your design? I can recommend palette options or offer specific advice for implementing it effectively.",
  "Do you see this color working in your theme? I can suggest color combinations or provide targeted recommendations for using it.",
  "Could you use this color in your project? I can recommend palette options or offer specific guidance for implementing it effectively.",
  "Is this a color that might enhance your theme? I can suggest complementary colors or provide tailored advice for using it.",
  "Would this color be a good fit for your design? I can recommend palette options or offer specific guidance for implementing it effectively.",
  "Do you think this color has potential for your project? I can suggest color combinations or provide targeted recommendations for its use.",
];

// Helper function to get attributes based on color properties
function getColorAttributes(
  colorName: string,
  hsl: { h: number; s: number; l: number }
): string[] {
  // Try to find attributes based on color name
  for (const [baseColor, attributes] of Object.entries(COLOR_ATTRIBUTES)) {
    if (colorName.toLowerCase().includes(baseColor)) {
      return attributes;
    }
  }

  // If no match by name, determine by hue
  const { h, s, l } = hsl;

  // For grayscale colors
  if (s < 15) {
    if (l < 20) return COLOR_ATTRIBUTES.black;
    if (l > 80) return COLOR_ATTRIBUTES.white;
    return COLOR_ATTRIBUTES.gray;
  }

  // For colors with saturation, determine by hue
  if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) return COLOR_ATTRIBUTES.red;
  if (h >= 30 && h < 60) return COLOR_ATTRIBUTES.orange;
  if (h >= 60 && h < 90) return COLOR_ATTRIBUTES.yellow;
  if (h >= 90 && h < 150) return COLOR_ATTRIBUTES.green;
  if (h >= 150 && h < 210) return COLOR_ATTRIBUTES.cyan;
  if (h >= 210 && h < 270) return COLOR_ATTRIBUTES.blue;
  if (h >= 270 && h < 330) return COLOR_ATTRIBUTES.purple;

  // Default
  return COLOR_ATTRIBUTES.gray;
}

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to format a template string with values
function formatTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

/**
 * Gets color name and attributes using the existing colorToName function
 */
async function getColorNameAndAttributes(
  hexColor: string
): Promise<{ name: string; attributes: string[] }> {
  // Get the color name using the existing function
  const name = await colorToName(hexColor);

  // Get color attributes based on the name and HSL values
  const c = colord(hexColor);
  const hsl = c.toHsl();
  const attributes = getColorAttributes(name, hsl);

  return { name, attributes };
}

// Helper function to simulate color blindness
function simulateColorBlindness(hexColor: string) {
  const c = colord(hexColor);
  const rgb = c.toRgb();
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Simplified simulation matrices
  // Protanopia (red-blind)
  const protanopia = colord({
    r: Math.round((0.567 * r + 0.433 * g) * 255),
    g: Math.round((0.558 * r + 0.442 * g) * 255),
    b: Math.round((0.242 * g + 0.758 * b) * 255),
  });

  // Deuteranopia (green-blind)
  const deuteranopia = colord({
    r: Math.round((0.625 * r + 0.375 * g) * 255),
    g: Math.round((0.7 * r + 0.3 * g) * 255),
    b: Math.round((0.3 * g + 0.7 * b) * 255),
  });

  // Tritanopia (blue-blind)
  const tritanopia = colord({
    r: Math.round((0.95 * r + 0.05 * g) * 255),
    g: Math.round((0.433 * g + 0.567 * b) * 255),
    b: Math.round((0.475 * g + 0.525 * b) * 255),
  });

  return {
    protanopia: protanopia.toHex(),
    deuteranopia: deuteranopia.toHex(),
    tritanopia: tritanopia.toHex(),
  };
}

// Update the getColorAdvice function to include random introductions and conclusions

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

    // Generate the response in markdown format with smaller headings and more tables
    // Now with random introduction and conclusion
    const advice = `
${intro}

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

${conclusion}
`;

    return {
      advice,
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
