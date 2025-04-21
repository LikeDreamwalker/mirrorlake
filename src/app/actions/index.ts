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

// Remove the COLOR_NAMES map since we'll use the colorToName function

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

// Harmony descriptions
const HARMONY_DESCRIPTIONS: Record<string, string> = {
  complementary:
    "Creates a strong contrast and vibrant look. Good for creating focus points.",
  analogous:
    "Creates a cohesive, harmonious feel with colors that sit next to each other on the color wheel.",
  triadic:
    "Offers vibrant contrast while maintaining color harmony, using three evenly spaced colors.",
  tetradic:
    "Rich, varied color scheme that works best when one color dominates and others are used as accents.",
  monochromatic:
    "Creates a cohesive look using variations in lightness and saturation of a single color.",
};

// Harmony use cases
const HARMONY_USES: Record<string, string[]> = {
  complementary: [
    "logos with visual impact",
    "sports team branding",
    "call-to-action buttons",
    "magazine covers",
    "event posters",
  ],
  analogous: [
    "natural landscapes",
    "harmonious UI designs",
    "relaxing environments",
    "spa branding",
    "educational materials",
  ],
  triadic: [
    "playful designs",
    "children's products",
    "creative applications",
    "art portfolios",
    "game interfaces",
  ],
  tetradic: [
    "rich illustrations",
    "fashion design",
    "seasonal promotions",
    "food packaging",
    "festival branding",
  ],
  monochromatic: [
    "elegant branding",
    "minimalist interfaces",
    "professional documents",
    "luxury products",
    "corporate identities",
  ],
};

// Color psychology by industry
const COLOR_PSYCHOLOGY: Record<
  string,
  { industries: string[]; psychology: string; brands: string[] }
> = {
  red: {
    industries: ["food", "retail", "entertainment"],
    psychology: "Creates urgency, stimulates appetite, and encourages action.",
    brands: ["Coca-Cola", "Netflix", "Target"],
  },
  orange: {
    industries: ["food", "e-commerce", "health"],
    psychology: "Conveys enthusiasm, creativity, and affordability.",
    brands: ["Fanta", "Amazon", "Nickelodeon"],
  },
  yellow: {
    industries: ["food", "leisure", "transportation"],
    psychology: "Evokes optimism, clarity, and warmth.",
    brands: ["McDonald's", "IKEA", "Hertz"],
  },
  green: {
    industries: ["health", "finance", "sustainability"],
    psychology: "Represents growth, health, and wealth.",
    brands: ["Whole Foods", "Starbucks", "John Deere"],
  },
  blue: {
    industries: ["finance", "technology", "healthcare"],
    psychology: "Builds trust, security, and reliability.",
    brands: ["Facebook", "IBM", "Visa"],
  },
  purple: {
    industries: ["luxury", "beauty", "creativity"],
    psychology: "Conveys luxury, creativity, and wisdom.",
    brands: ["Cadbury", "Hallmark", "Yahoo"],
  },
  pink: {
    industries: ["beauty", "fashion", "confectionery"],
    psychology: "Suggests playfulness, femininity, and sweetness.",
    brands: ["Barbie", "Victoria's Secret", "Baskin-Robbins"],
  },
};

// Color blindness simulation descriptions
const COLOR_BLINDNESS = {
  protanopia:
    "Red-blind (difficulty distinguishing reds and greens, reds appear darker)",
  deuteranopia:
    "Green-blind (difficulty distinguishing reds and greens, greens appear darker)",
  tritanopia: "Blue-blind (difficulty distinguishing blues and yellows)",
};

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Replace the getColorNameAndAttributes function with a new function that uses colorToName
// and update the getColorAdvice function to use it

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

// Helper function to get color psychology
function getColorPsychology(baseColor: string) {
  for (const [color, info] of Object.entries(COLOR_PSYCHOLOGY)) {
    if (baseColor.includes(color)) {
      return info;
    }
  }

  return {
    industries: ["various"],
    psychology: "Has versatile psychological effects depending on context.",
    brands: ["Various"],
  };
}

// Helper function to get use cases
function getUseCases(
  colorName: string,
  attributes: string[],
  contrastLevel: string
) {
  const useCases: string[] = [];

  // Based on color attributes
  if (
    attributes.some((attr) =>
      ["energetic", "attention-grabbing", "bold"].includes(attr)
    )
  ) {
    useCases.push("call-to-action buttons");
    useCases.push("promotional materials");
  }

  if (
    attributes.some((attr) =>
      ["calm", "trustworthy", "reliable"].includes(attr)
    )
  ) {
    useCases.push("financial applications");
    useCases.push("healthcare interfaces");
  }

  if (
    attributes.some((attr) =>
      ["professional", "formal", "sophisticated"].includes(attr)
    )
  ) {
    useCases.push("business websites");
    useCases.push("corporate branding");
  }

  if (
    attributes.some((attr) => ["fresh", "natural", "balanced"].includes(attr))
  ) {
    useCases.push("eco-friendly products");
    useCases.push("wellness applications");
  }

  if (
    attributes.some((attr) =>
      ["creative", "innovative", "imaginative"].includes(attr)
    )
  ) {
    useCases.push("art portfolios");
    useCases.push("creative agency branding");
  }

  // Based on contrast level
  if (contrastLevel === "good" || contrastLevel === "excellent") {
    useCases.push("text elements");
    useCases.push("navigation components");
  } else {
    useCases.push("decorative elements");
    useCases.push("background accents");
  }

  // Generic uses
  const genericUses = [
    "secondary branding elements",
    "accent colors",
    "background gradients",
    "infographic elements",
    "social media graphics",
    "digital illustrations",
    "product packaging",
    "email marketing",
    "mobile app interfaces",
    "data visualization",
  ];

  // Add generic uses if we don't have enough
  while (useCases.length < 3) {
    const randomUse = getRandomItem(genericUses);
    if (!useCases.includes(randomUse)) {
      useCases.push(randomUse);
    }
  }

  return useCases.slice(0, 3);
}

// Update the getColorAdvice function to include a friendly introduction and conclusion

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

    // Generate the response in markdown format with smaller headings and more tables
    // Now with a friendly introduction and conclusion
    const advice = `
I've analyzed the color ${hexColor} (${colorName}) and found the following information:

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

Would you like to add this color to your theme? I can also suggest color combinations or provide more specific information about how to use this color effectively in your design.
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
