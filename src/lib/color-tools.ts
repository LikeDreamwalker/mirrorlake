import { useStore } from "@/store";
import { colord, extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";
import harmoniesPlugin from "colord/plugins/harmonies";
import mixPlugin from "colord/plugins/mix";
import { colorToName } from "@/app/actions/color";

// Extend colord with plugins
extend([cmykPlugin, namesPlugin, a11yPlugin, harmoniesPlugin, mixPlugin]);

// Create a store instance that can be used outside of React components
// This is needed because we can't use hooks in server-side code
let storeInstance: ReturnType<typeof useStore.getState> | null = null;

// Function to safely get the store state
const getStore = () => {
  // If we're in a browser environment, we can use the store directly
  if (typeof window !== "undefined") {
    return useStore.getState();
  }

  // If we already have a store instance, use it
  if (storeInstance) {
    return storeInstance;
  }

  // Otherwise, create a new instance
  try {
    storeInstance = useStore.getState();
    return storeInstance;
  } catch (error) {
    console.error("Error accessing store state:", error);
    // Return a minimal mock implementation to prevent crashes
    return {
      baseColor: "#0066FF",
      colors: [],
      addColor: async (color: string, name: string) => {
        console.warn("Mock addColor called - store not properly initialized");
      },
      removeColor: (id: string) => {
        console.warn(
          "Mock removeColor called - store not properly initialized"
        );
      },
      toggleFavorite: (id: string) => {
        console.warn(
          "Mock toggleFavorite called - store not properly initialized"
        );
      },
    };
  }
};

// Tool implementations
export async function handleAddColorsToTheme(params: {
  themeName: string;
  colors: Array<{ color: string; name: string }>;
}) {
  const store = getStore();

  console.log("Adding colors to theme:", params.themeName, params.colors);

  // Add each color to the store - now with await
  for (const colorItem of params.colors) {
    await store.addColor(colorItem.color, colorItem.name);
  }

  return {
    success: true,
    message: `Added ${params.colors.length} colors with theme "${params.themeName}"`,
    colors: params.colors,
  };
}

export async function handleUpdateTheme(params: {
  themeName: string;
  colors: Array<{ color: string; name: string }>;
}) {
  const store = getStore();

  console.log("Updating theme:", params.themeName, params.colors);

  // Process each color sequentially with await
  for (const colorItem of params.colors) {
    // Check if a color with this name already exists
    const existingColors = store.colors.filter(
      (c) => c.name === colorItem.name
    );

    // Remove existing colors with the same name
    existingColors.forEach((color) => {
      store.removeColor(color.id);
    });

    // Add the new color - now with await
    await store.addColor(colorItem.color, colorItem.name);
  }

  return {
    success: true,
    message: `Updated theme "${params.themeName}" with ${params.colors.length} colors`,
    colors: params.colors,
  };
}

export function handleResetTheme() {
  const store = getStore();

  console.log("Resetting theme");

  // Get all color IDs
  const colorIds = store.colors.map((color) => color.id);

  // Remove all colors
  colorIds.forEach((id) => {
    store.removeColor(id);
  });

  return {
    success: true,
    message: "Theme has been reset. All colors have been removed.",
  };
}

export function handleRemoveColorsFromTheme(params: { colorNames: string[] }) {
  const store = getStore();

  console.log("Removing colors from theme:", params.colorNames);

  let removedCount = 0;

  // Remove colors by name
  params.colorNames.forEach((name) => {
    const colorsToRemove = store.colors.filter(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    colorsToRemove.forEach((color) => {
      store.removeColor(color.id);
      removedCount++;
    });
  });

  return {
    success: true,
    message: `Removed ${removedCount} colors from the theme`,
    removedColors: params.colorNames,
  };
}

export function handleMarkColorAsFavorite(params: { colorName: string }) {
  const store = getStore();

  console.log("Marking color as favorite:", params.colorName);

  // Find the color by name
  const color = store.colors.find(
    (c) => c.name.toLowerCase() === params.colorName.toLowerCase()
  );

  if (color) {
    store.toggleFavorite(color.id);
    return {
      success: true,
      message: `Marked "${params.colorName}" as favorite`,
      color: color.color,
    };
  }

  return {
    success: false,
    message: `Color "${params.colorName}" not found in the theme`,
  };
}

export function handleGetCurrentColors() {
  const store = getStore();

  console.log("Getting current colors");

  return {
    currentColor: store.baseColor,
    savedColors: store.colors.map((color) => ({
      id: color.id,
      name: color.name,
      color: color.color,
      favorite: color.favorite || false,
    })),
  };
}

export async function handleGetColorInfo(params: { color: string }) {
  const { color } = params;

  console.log("Getting color info for:", color);

  // Use colord for all color operations
  const c = colord(color);
  const rgb = c.toRgb();
  const hsl = c.toHsl();

  // Calculate luminance using colord
  const luminance = c.luminance();

  // Get contrast color
  const contrastColor = c.isDark() ? "#FFFFFF" : "#000000";

  // Generate a color name using the server action
  const colorName = await colorToName(color);

  // Now use the async versions of these functions
  const complementary = await calculateComplementary(color);
  const analogous = await calculateAnalogous(color);

  return {
    formats: {
      hex: c.toHex().toUpperCase(),
      rgb: c.toRgbString(),
      hsl: c.toHslString(),
    },
    properties: {
      name: colorName,
      isLight: !c.isDark(),
      luminance: luminance.toFixed(2),
      contrastColor: contrastColor,
    },
    harmony: {
      complementary,
      analogous,
    },
  };
}

export async function handleGenerateColorPalette(params: {
  baseColor: string;
  paletteType:
    | "analogous"
    | "complementary"
    | "triadic"
    | "tetradic"
    | "monochromatic";
  count?: number;
}) {
  const { baseColor, paletteType, count = 5 } = params;

  console.log(`Generating ${paletteType} palette based on ${baseColor}`);

  const c = colord(baseColor);
  const hsl = c.toHsl();
  let palette: Array<{ color: string; name: string }> = [];

  switch (paletteType) {
    case "analogous": {
      // Generate analogous colors using colord's harmonies plugin
      const analogousColors = c.harmonies("analogous");

      // Skip the first color as it's the base color
      const colors = await Promise.all(
        analogousColors.slice(1).map(async (color) => {
          return {
            color: color.toHex().toUpperCase(),
            name: await colorToName(color.toHex()),
          };
        })
      );

      palette = colors;
      break;
    }
    case "complementary": {
      // Generate complementary color using colord's harmonies plugin
      const complementaryColors = c.harmonies("complementary");

      // Skip the first color as it's the base color
      const complementary = complementaryColors[1];
      const complementaryHex = complementary.toHex().toUpperCase();

      palette = [
        {
          color: complementaryHex,
          name: await colorToName(complementaryHex),
        },
      ];
      break;
    }
    case "triadic": {
      // Generate triadic colors using colord's harmonies plugin
      const triadicColors = c.harmonies("triadic");

      // Skip the first color as it's the base color
      const colors = await Promise.all(
        triadicColors.slice(1).map(async (color) => {
          return {
            color: color.toHex().toUpperCase(),
            name: await colorToName(color.toHex()),
          };
        })
      );

      palette = colors;
      break;
    }
    case "tetradic": {
      // Generate tetradic colors using colord's harmonies plugin
      const tetradicColors = c.harmonies("tetradic");

      // Skip the first color as it's the base color
      const colors = await Promise.all(
        tetradicColors.slice(1).map(async (color) => {
          return {
            color: color.toHex().toUpperCase(),
            name: await colorToName(color.toHex()),
          };
        })
      );

      palette = colors;
      break;
    }
    case "monochromatic": {
      // Generate monochromatic colors (same hue, different lightness/saturation)
      const colors = [];
      // Vary lightness
      for (let i = 1; i <= Math.min(count, 4); i++) {
        const newLightness = Math.max(
          10,
          Math.min(90, hsl.l + (i % 2 === 0 ? i * 10 : -i * 10))
        );
        const newColor = colord({ h: hsl.h, s: hsl.s, l: newLightness });
        const colorHex = newColor.toHex().toUpperCase();
        const name = await colorToName(colorHex);
        colors.push({
          color: colorHex,
          name,
        });
      }
      palette = colors;
      break;
    }
  }

  // Add the base color to the palette
  const baseName = await colorToName(c.toHex());
  palette.unshift({ color: c.toHex().toUpperCase(), name: baseName });

  // Limit to requested count
  palette = palette.slice(0, count);

  return {
    success: true,
    baseColor,
    paletteType,
    palette,
  };
}

// Helper functions for color harmony using colord - now async to match store
export async function calculateComplementary(
  hexColor: string
): Promise<string> {
  const complementaryColors = colord(hexColor).harmonies("complementary");
  return complementaryColors[1].toHex().toUpperCase();
}

export async function calculateAnalogous(hexColor: string): Promise<string[]> {
  const analogousColors = colord(hexColor).harmonies("analogous");
  // Return the two analogous colors (excluding the base color)
  return [
    analogousColors[1].toHex().toUpperCase(),
    analogousColors[2].toHex().toUpperCase(),
  ];
}

export const colorToolRegistry = {
  addColorsToTheme: handleAddColorsToTheme,
  updateTheme: handleUpdateTheme,
  resetTheme: handleResetTheme,
  removeColorsFromTheme: handleRemoveColorsFromTheme,
  markColorAsFavorite: handleMarkColorAsFavorite,
  getCurrentColors: handleGetCurrentColors,
  getColorInfo: handleGetColorInfo,
  generateColorPalette: handleGenerateColorPalette,
};

// Color utility functions using colord
export const hslToRgb = (h: number, s: number, l: number) => {
  const rgb = colord({ h, s, l }).toRgb();
  return { r: rgb.r, g: rgb.g, b: rgb.b };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return colord({ r, g, b }).toHex().toUpperCase();
};

export const hslToHex = (h: number, s: number, l: number): string => {
  return colord({ h, s, l }).toHex().toUpperCase();
};

export const alphaToHex = (alpha: number): string => {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
};

export const hexToRgb = (hex: string) => {
  const rgb = colord(hex).toRgb();
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    a: colord(hex).alpha(),
  };
};

export const rgbToHsl = (r: number, g: number, b: number) => {
  const hsl = colord({ r, g, b }).toHsl();
  return { h: hsl.h, s: hsl.s, l: hsl.l };
};

export const hexToHsl = (hex: string) => {
  const hsl = colord(hex).toHsl();
  return hsl;
};

// Calculate luminance for WCAG contrast
export const calculateLuminance = (r: number, g: number, b: number): number => {
  return colord({ r, g, b }).luminance();
};

export const getContrastColor = (hex: string): string => {
  return colord(hex).isDark() ? "#FFFFFF" : "#000000";
};

// Determine if a color is dark (for theme switching)
export const isColorDark = (hex: string): boolean => {
  return colord(hex).isDark();
};

// Additional utility functions that leverage colord's capabilities
export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  return colord(foreground).contrast(colord(background));
};

export const getReadableTextColor = (backgroundColor: string): string => {
  return colord(backgroundColor).isDark() ? "#FFFFFF" : "#000000";
};

export const getColorName = async (color: string): Promise<string | null> => {
  // First try the colord built-in name function
  const colorName = colord(color).toName();
  if (colorName) return colorName;

  // If that fails, use our server action
  try {
    return await colorToName(color);
  } catch (error) {
    console.error("Error getting color name:", error);
    return null;
  }
};

export const mixColors = (
  color1: string,
  color2: string,
  ratio = 0.5
): string => {
  return colord(color1).mix(color2, ratio).toHex().toUpperCase();
};

export const adjustColorBrightness = (
  color: string,
  amount: number
): string => {
  return amount > 0
    ? colord(color).lighten(amount).toHex().toUpperCase()
    : colord(color).darken(Math.abs(amount)).toHex().toUpperCase();
};

export const saturateColor = (color: string, amount: number): string => {
  return amount > 0
    ? colord(color).saturate(amount).toHex().toUpperCase()
    : colord(color).desaturate(Math.abs(amount)).toHex().toUpperCase();
};

export const rotateHue = (color: string, degrees: number): string => {
  return colord(color).rotate(degrees).toHex().toUpperCase();
};

export const getColorTints = (color: string, count = 5): string[] => {
  const tints: string[] = [];
  const c = colord(color);

  for (let i = 1; i <= count; i++) {
    const amount = i / (count + 1);
    tints.push(c.mix("white", amount).toHex().toUpperCase());
  }

  return tints;
};

export const getColorShades = (color: string, count = 5): string[] => {
  const shades: string[] = [];
  const c = colord(color);

  for (let i = 1; i <= count; i++) {
    const amount = i / (count + 1);
    shades.push(c.mix("black", amount).toHex().toUpperCase());
  }

  return shades;
};

export const getColorPalette = (
  color: string,
  type: "analogous" | "complementary" | "triadic" | "tetradic"
) => {
  return colord(color)
    .harmonies(type)
    .map((c) => c.toHex().toUpperCase());
};
