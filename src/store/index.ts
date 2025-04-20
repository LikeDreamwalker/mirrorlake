"use client";

import { create } from "zustand";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  alphaToHex,
  hexToRgb,
  isColorDark,
  rgbToHsl,
  rgbToHex,
  hslToHex,
  hslToRgb,
} from "@/lib/color-tools";
import { colorToName } from "@/app/actions/color";

export type ColorFormat = "hex" | "rgb" | "hsl";

// Define the color item type for the theme
export interface ColorItem {
  id: string;
  name: string;
  info?: string;
  color: string; // HEX
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  alpha: number;
  createdAt: Date;
  favorite?: boolean;
}

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create a function to generate a color item from a hex color
const createColorItem = (color: string, name = "", info = ""): ColorItem => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    id: generateId(),
    name: name || `Color ${color.toUpperCase()}`,
    info,
    color: color.toUpperCase(),
    rgb: {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
    },
    hsl: {
      h: hsl.h,
      s: hsl.s,
      l: hsl.l,
    },
    alpha: 1,
    createdAt: new Date(),
    favorite: false,
  };
};

// Calculate the correct values for #0066FF
const defaultColor = "#0066FF";
const defaultRgb = hexToRgb(defaultColor);
const defaultHsl = rgbToHsl(defaultRgb.r, defaultRgb.g, defaultRgb.b);
const defaultIsDark = isColorDark(defaultColor);

// Define the store state
interface StoreState {
  // Color picker state
  baseColor: string;
  currentColor: string;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  rgb: { r: number; g: number; b: number };
  format: ColorFormat;
  isDark: boolean;
  hslChanged: boolean;
  autoSwitchTheme: boolean;

  // Theme state
  colors: ColorItem[];
  recentColors: string[];

  // Pending color names (for async operations)
  pendingColorNames: Map<string, string>;
}

// Add a new interface for the combined update method parameters
interface ColorUpdateParams {
  hue?: number;
  saturation?: number;
  lightness?: number;
  alpha?: number;
  baseColor?: string;
}

// Add this to the StoreActions interface
interface StoreActions {
  // Color picker actions
  setBaseColor: (color: string) => void;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  setFormat: (format: ColorFormat) => void;
  setAutoSwitchTheme: (autoSwitch: boolean) => void;
  getFullColor: () => string;
  getColorString: () => string;
  getBackgroundColor: () => string;
  generateRandomColor: () => void;
  setColorFromHex: (hex: string) => void;
  setColorFromRgb: (r: number, g: number, b: number) => void;
  setColorFromHsl: (h: number, s: number, l: number) => void;
  updateCurrentColor: () => void;

  // Add this new method
  updateColorValues: (params: ColorUpdateParams) => void;

  // Theme actions
  addColor: (color: string, name?: string, info?: string) => Promise<void>;
  removeColor: (colorId: string) => void;
  updateColor: (
    colorId: string,
    updates: Partial<Omit<ColorItem, "id">>
  ) => void;
  toggleFavorite: (colorId: string) => void;
  getColorById: (colorId: string) => ColorItem | null;
  getColorName: (color: string) => Promise<string>;

  // New async color name methods
  fetchAndUpdateColorName: (color: string, id: string) => Promise<void>;
  fetchColorName: (color: string) => Promise<string>;

  // New theme management actions
  addColorsToTheme: (params: {
    themeName: string;
    colors: Array<{ color: string; name: string }>;
  }) => void;
  updateTheme: (params: {
    themeName: string;
    colors: Array<{ color: string; name: string }>;
  }) => void;
  resetTheme: () => void;
  removeColorsFromTheme: (params: { colorNames: string[] }) => void;
  markColorAsFavorite: (params: { colorName: string }) => void;
  generateColorPalette: (params: {
    baseColor: string;
    paletteType:
      | "analogous"
      | "complementary"
      | "triadic"
      | "tetradic"
      | "monochromatic";
    count?: number;
  }) => Promise<{
    success: boolean;
    baseColor: string;
    paletteType: string;
    palette: Array<{ color: string; name: string }>;
  }>;
}

// Add this to the store implementation
export const useStore = create<StoreState & StoreActions>((set, get) => ({
  // Initial color picker state
  baseColor: defaultColor,
  currentColor: defaultColor,
  hue: defaultHsl.h,
  saturation: defaultHsl.s,
  lightness: defaultHsl.l,
  alpha: 1,
  rgb: { r: defaultRgb.r, g: defaultRgb.g, b: defaultRgb.b },
  format: "hex" as ColorFormat,
  isDark: defaultIsDark,
  hslChanged: false,
  autoSwitchTheme: true,

  // Initial theme state
  colors: [createColorItem(defaultColor, "Blue", "Default blue color")],
  recentColors: [defaultColor],

  // For managing async color name operations
  pendingColorNames: new Map(),

  // Color picker actions
  setBaseColor: (color: string) => {
    set({ baseColor: color });
    // Don't call updateCurrentColor here
  },

  setHue: (hue: number) => {
    set({ hue, hslChanged: true });
    // Don't call updateCurrentColor here
  },

  setSaturation: (saturation: number) => {
    set({ saturation, hslChanged: true });
    // Don't call updateCurrentColor here
  },

  setLightness: (lightness: number) => {
    set({ lightness, hslChanged: true });
    // Don't call updateCurrentColor here
  },

  setAlpha: (alpha: number) => {
    set({ alpha });
    // Don't call updateCurrentColor here
  },

  setFormat: (format: ColorFormat) => set({ format }),

  setAutoSwitchTheme: (autoSwitchTheme: boolean) => set({ autoSwitchTheme }),

  getFullColor: () => {
    const { baseColor, alpha } = get();
    return alpha < 1 ? `${baseColor}${alphaToHex(alpha)}` : baseColor;
  },

  getColorString: () => {
    const { format, currentColor, rgb, alpha, hue, saturation, lightness } =
      get();

    switch (format) {
      case "hex":
        return currentColor;
      case "rgb":
        return alpha < 1
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case "hsl":
        return alpha < 1
          ? `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
          : `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      default:
        return currentColor;
    }
  },

  getBackgroundColor: () => {
    const { rgb, alpha, currentColor } = get();
    if (alpha < 1) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    return currentColor;
  },

  generateRandomColor: () => {
    const randomHex = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    get().setColorFromHex(randomHex);
  },

  setColorFromHex: (hex: string) => {
    // Basic validation for hex format
    if (/^#?[0-9A-Fa-f]{0,8}$/i.test(hex)) {
      // Ensure the hex starts with #
      if (!hex.startsWith("#")) {
        hex = `#${hex}`;
      }

      // Only process complete hex values
      if (hex.length >= 7) {
        const baseHex = hex.substring(0, 7).toUpperCase();

        // Update HSL values without triggering another update
        try {
          const rgb = hexToRgb(baseHex);
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

          // If we have alpha in the hex
          let alphaValue = 1;
          if (hex.length === 9) {
            const alphaHex = hex.substring(7, 9);
            alphaValue = Number.parseInt(alphaHex, 16) / 255;
          }

          set({
            baseColor: baseHex,
            hue: hsl.h,
            saturation: hsl.s,
            lightness: hsl.l,
            alpha: alphaValue,
            hslChanged: false,
            rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
          });

          get().updateCurrentColor();
        } catch (error) {
          console.log("Invalid hex value:", hex, error);
        }
      }
    }
  },

  // Modify the setColorFromRgb function to preserve exact RGB values
  setColorFromRgb: (r: number, g: number, b: number) => {
    // Convert RGB directly to hex and update the source of truth
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    set({
      baseColor: hex,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
      hslChanged: false,
      rgb: { r, g, b }, // Store the exact RGB values provided by the user
    });

    get().updateCurrentColor();
  },

  setColorFromHsl: (h: number, s: number, l: number) => {
    set({
      hue: h,
      saturation: s,
      lightness: l,
      hslChanged: true,
    });

    get().updateCurrentColor();
  },

  updateCurrentColor: () => {
    const {
      baseColor,
      alpha,
      hue,
      saturation,
      lightness,
      hslChanged,
      recentColors,
      autoSwitchTheme,
    } = get();

    // When HSL values change, update the baseColor
    let newBaseColor = baseColor;
    if (hslChanged) {
      newBaseColor = hslToHex(hue, saturation, lightness);
      set({ baseColor: newBaseColor, hslChanged: false });
    }

    // Update RGB values
    const rgb = hslToRgb(hue, saturation, lightness);

    // Update currentColor from baseColor and alpha
    const newCurrentColor =
      alpha < 1 ? `${newBaseColor}${alphaToHex(alpha)}` : newBaseColor;

    // Check if the color is dark
    const dark = isColorDark(newBaseColor);

    // Update recent colors if this is a new color
    let updatedRecentColors = recentColors;
    if (!recentColors.includes(newCurrentColor)) {
      updatedRecentColors = [newCurrentColor, ...recentColors.slice(0, 7)];
    }

    set({
      currentColor: newCurrentColor,
      rgb,
      isDark: dark,
      recentColors: updatedRecentColors,
    });

    // REMOVE THIS LINE - Don't automatically add to color history
    // get().addColor(newBaseColor)
  },

  // Add this after the existing setter methods
  updateColorValues: (params: ColorUpdateParams) => {
    const updates: any = {};

    if (params.baseColor !== undefined) {
      updates.baseColor = params.baseColor;
    }

    if (params.hue !== undefined) {
      updates.hue = params.hue;
      updates.hslChanged = true;
    }

    if (params.saturation !== undefined) {
      updates.saturation = params.saturation;
      updates.hslChanged = true;
    }

    if (params.lightness !== undefined) {
      updates.lightness = params.lightness;
      updates.hslChanged = true;
    }

    if (params.alpha !== undefined) {
      updates.alpha = params.alpha;
    }

    // Only update state if we have changes
    if (Object.keys(updates).length > 0) {
      set(updates);
      get().updateCurrentColor();
    }
  },

  // New method to fetch and update a color name
  fetchAndUpdateColorName: async (color: string, id: string) => {
    try {
      const name = await colorToName(color);
      if (name) {
        // Update the color with the new name
        get().updateColor(id, { name });
      }
    } catch (error) {
      console.error("Error fetching color name:", error);
    }
  },

  // New method to fetch a color name
  fetchColorName: async (color: string): Promise<string> => {
    try {
      return await colorToName(color);
    } catch (error) {
      console.error("Error fetching color name:", error);
      return "";
    }
  },

  // Theme actions
  addColor: async (color: string, name = "", info = "") => {
    // If no name is provided, get one from the server action
    let colorName = name;
    if (!colorName) {
      try {
        colorName = await colorToName(color);
      } catch (error) {
        console.error("Error getting color name:", error);
        colorName = `Color ${color.toUpperCase()}`;
      }
    }

    const newColor = createColorItem(color, colorName, info);

    // Check if this color already exists to avoid duplicates
    const existingColorIndex = get().colors.findIndex(
      (c) => c.color.toLowerCase() === color.toLowerCase()
    );

    if (existingColorIndex !== -1) {
      // If it exists, just move it to the top
      set((state) => {
        const updatedColors = [...state.colors];
        const [existingColor] = updatedColors.splice(existingColorIndex, 1);
        return {
          colors: [existingColor, ...updatedColors],
        };
      });
    } else {
      // Otherwise add the new color and limit to 21 colors
      set((state) => ({
        colors: [newColor, ...state.colors].slice(0, 21),
      }));
    }
  },

  removeColor: (colorId: string) => {
    set((state) => ({
      colors: state.colors.filter((c) => c.id !== colorId),
    }));
  },

  updateColor: (colorId: string, updates: Partial<Omit<ColorItem, "id">>) => {
    set((state) => ({
      colors: state.colors.map((c) => {
        if (c.id === colorId) {
          return { ...c, ...updates };
        }
        return c;
      }),
    }));
  },

  toggleFavorite: (colorId: string) => {
    set((state) => ({
      colors: state.colors.map((c) => {
        if (c.id === colorId) {
          return { ...c, favorite: !c.favorite };
        }
        return c;
      }),
    }));
  },

  getColorById: (colorId: string) => {
    return get().colors.find((c) => c.id === colorId) || null;
  },

  // getColorName: () => {
  //   const { hue, saturation, lightness } = get();
  //   return generateColorName(hue, saturation, lightness);

  getColorName: async (color: string) => {
    try {
      const { hue, saturation, lightness } = get();
      const finalColor = color || hslToHex(hue, saturation, lightness);
      return await colorToName(finalColor);
    } catch (error) {
      console.error("Error getting color name:", error);
      return "";
    }
  },

  // New theme management actions moved from chat provider
  addColorsToTheme: (params) => {
    const { themeName, colors } = params;
    console.log("Adding colors to theme:", themeName, colors);

    // Add each color to the store
    colors.forEach((colorItem) => {
      get().addColor(colorItem.color, colorItem.name);
    });

    // Show a toast notification if available
    if (typeof toast !== "undefined") {
      toast.success(`Added ${colors.length} colors to "${themeName}" theme`);
    }

    return {
      success: true,
      message: `Added ${colors.length} colors with theme "${themeName}"`,
      colors,
    };
  },

  updateTheme: (params) => {
    const { themeName, colors } = params;
    console.log("Updating theme:", themeName, colors);
    const store = get();

    // Update each color in the store
    colors.forEach((colorItem) => {
      // Check if a color with this name already exists
      const existingColors = store.colors.filter(
        (c) => c.name === colorItem.name
      );

      // Remove existing colors with the same name
      existingColors.forEach((color) => {
        store.removeColor(color.id);
      });

      // Add the new color
      store.addColor(colorItem.color, colorItem.name);
    });

    // Show a toast notification if available
    if (typeof toast !== "undefined") {
      toast.success(
        `Updated "${themeName}" theme with ${colors.length} colors`
      );
    }

    return {
      success: true,
      message: `Updated theme "${themeName}" with ${colors.length} colors`,
      colors,
    };
  },

  resetTheme: () => {
    console.log("Resetting theme");
    const store = get();

    // Get all color IDs
    const colorIds = store.colors.map((color) => color.id);

    // Remove all colors
    colorIds.forEach((id) => {
      store.removeColor(id);
    });

    // Show a toast notification if available
    if (typeof toast !== "undefined") {
      toast.info("Theme has been reset");
    }

    return {
      success: true,
      message: "Theme has been reset. All colors have been removed.",
    };
  },

  removeColorsFromTheme: (params) => {
    const { colorNames } = params;
    console.log("Removing colors from theme:", colorNames);
    const store = get();

    let removedCount = 0;

    // Remove colors by name
    colorNames.forEach((name) => {
      const colorsToRemove = store.colors.filter(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      colorsToRemove.forEach((color) => {
        store.removeColor(color.id);
        removedCount++;
      });
    });

    // Show a toast notification if available
    if (typeof toast !== "undefined") {
      toast.info(`Removed ${removedCount} colors from the theme`);
    }

    return {
      success: true,
      message: `Removed ${removedCount} colors from the theme`,
      removedColors: colorNames,
    };
  },

  markColorAsFavorite: (params) => {
    const { colorName } = params;
    console.log("Marking color as favorite:", colorName);
    const store = get();

    // Find the color by name
    const color = store.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );

    if (color) {
      store.toggleFavorite(color.id);

      // Show a toast notification if available
      if (typeof toast !== "undefined") {
        toast.success(`Marked "${colorName}" as favorite`);
      }

      return {
        success: true,
        message: `Marked "${colorName}" as favorite`,
        color: color.color,
      };
    }

    // Show a toast notification if available
    if (typeof toast !== "undefined") {
      toast.error(`Color "${colorName}" not found in the theme`);
    }

    return {
      success: false,
      message: `Color "${colorName}" not found in the theme`,
    };
  },

  generateColorPalette: async (params) => {
    const { baseColor, paletteType, count = 5 } = params;
    console.log(`Generating ${paletteType} palette based on ${baseColor}`);
    const store = get();

    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    let palette: Array<{ color: string; name: string }> = [];

    switch (paletteType) {
      case "analogous": {
        // Generate analogous colors (adjacent on the color wheel)
        const colors = [];
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue; // Skip the base color
          const newHue = (hsl.h + i * 30 + 360) % 360;
          const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
          // Use the server action to get a better color name
          const name = await colorToName(newHex);
          colors.push({ color: newHex, name: name || `Color ${newHex}` });
        }
        palette = colors;
        break;
      }
      case "complementary": {
        // Generate complementary color (opposite on the color wheel)
        const complementaryHue = (hsl.h + 180) % 360;
        const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
        const complementaryHex = rgbToHex(
          complementaryRgb.r,
          complementaryRgb.g,
          complementaryRgb.b
        );
        // Use the server action to get a better color name
        const name = await colorToName(complementaryHex);
        palette = [
          {
            color: complementaryHex,
            name: name || `Color ${complementaryHex}`,
          },
        ];
        break;
      }
      case "triadic": {
        // Generate triadic colors (evenly spaced around the color wheel)
        const colors = [];
        for (let i = 1; i <= 2; i++) {
          const newHue = (hsl.h + i * 120) % 360;
          const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
          // Use the server action to get a better color name
          const name = await colorToName(newHex);
          colors.push({ color: newHex, name: name || `Color ${newHex}` });
        }
        palette = colors;
        break;
      }
      case "tetradic": {
        // Generate tetradic colors (rectangle on the color wheel)
        const colors = [];
        for (let i = 1; i <= 3; i++) {
          const newHue = (hsl.h + i * 90) % 360;
          const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
          // Use the server action to get a better color name
          const name = await colorToName(newHex);
          colors.push({ color: newHex, name: name || `Color ${newHex}` });
        }
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
          const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
          // Use the server action to get a better color name
          const name = await colorToName(newHex);
          colors.push({ color: newHex, name: name || `Color ${newHex}` });
        }
        palette = colors;
        break;
      }
    }

    // Add the base color to the palette
    // Use the server action to get a better name for the base color
    const baseName = await colorToName(baseColor);
    palette.unshift({
      color: baseColor,
      name: baseName || `Color ${baseColor}`,
    });

    // Limit to requested count
    palette = palette.slice(0, count);

    // Add the generated palette to the theme
    for (const colorItem of palette) {
      await store.addColor(colorItem.color, colorItem.name);
    }

    // Show a toast notification if available
    if (typeof toast !== "undefined") {
      toast.success(
        `Generated ${palette.length} colors for ${paletteType} palette`
      );
    }

    return {
      success: true,
      baseColor,
      paletteType,
      palette,
    };
  },
}));

// Create a hook to handle theme switching
export function useColorThemeSwitcher(initialColor = "#0066FF") {
  const { setTheme } = useTheme();
  const { isDark, setColorFromHex, autoSwitchTheme } = useStore();

  // Initialize from initialColor
  useEffect(() => {
    if (initialColor) {
      setColorFromHex(initialColor);
    }
  }, [initialColor, setColorFromHex]);

  // Handle theme switching
  useEffect(() => {
    if (autoSwitchTheme) {
      setTheme(isDark ? "dark" : "light");
    }
  }, [isDark, autoSwitchTheme, setTheme]);

  return null;
}

// Export additional color harmony functions - now async
export async function calculateComplementary(
  hexColor: string
): Promise<string> {
  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Complementary color is 180 degrees away on the color wheel
  const complementaryHue = (hsl.h + 180) % 360;

  // Convert back to RGB and then to hex
  const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
  return rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
}

export async function calculateAnalogous(
  hexColor: string,
  hsl?: { h: number; s: number; l: number }
): Promise<string[]> {
  // If HSL is not provided, calculate it from the hex color
  if (!hsl) {
    const rgb = hexToRgb(hexColor);
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  // Analogous colors are 30 degrees away on either side
  const hue1 = (hsl.h + 30) % 360;
  const hue2 = (hsl.h + 330) % 360; // equivalent to (hsl.h - 30 + 360) % 360

  // Convert to RGB and then to hex
  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);

  return [rgbToHex(rgb1.r, rgb1.g, rgb1.b), rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
}

// Export additional color scheme functions - now async
export async function calculateTriadic(hexColor: string): Promise<string[]> {
  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Triadic colors are 120 degrees apart
  const hue1 = (hsl.h + 120) % 360;
  const hue2 = (hsl.h + 240) % 360;

  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);

  return [rgbToHex(rgb1.r, rgb1.g, rgb1.b), rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
}

export async function calculateTetradic(hexColor: string): Promise<string[]> {
  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Tetradic colors are in a rectangle on the color wheel
  const hue1 = (hsl.h + 90) % 360;
  const hue2 = (hsl.h + 180) % 360;
  const hue3 = (hsl.h + 270) % 360;

  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);
  const rgb3 = hslToRgb(hue3, hsl.s, hsl.l);

  return [
    rgbToHex(rgb1.r, rgb1.g, rgb1.b),
    rgbToHex(rgb2.r, rgb2.g, rgb2.b),
    rgbToHex(rgb3.r, rgb3.g, rgb3.b),
  ];
}
