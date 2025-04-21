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

/**
 * Supported color format types
 */
export type ColorFormat = "hex" | "rgb" | "hsl";

/**
 * Color item interface representing a color in the theme
 */
export interface ColorItem {
  /** Unique identifier for the color */
  id: string;
  /** Human-readable name of the color */
  name: string;
  /** Additional information about the color */
  info?: string;
  /** HEX representation of the color */
  color: string;
  /** RGB representation of the color */
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  /** HSL representation of the color */
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  /** Alpha/opacity value (0-1) */
  alpha: number;
  /** When the color was created */
  createdAt: Date;
  /** Whether the color is marked as favorite */
  favorite?: boolean;
}

/**
 * Generates a unique ID for color items
 */
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Creates a new color item from a hex color
 *
 * @param color - HEX color string
 * @param name - Optional name for the color
 * @param info - Optional additional information
 * @returns A complete ColorItem object
 */
const createColorItem = (color: string, name = "", info = ""): ColorItem => {
  const normalizedColor = color.toUpperCase();
  const rgb = hexToRgb(normalizedColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    id: generateId(),
    name: name || `Color ${normalizedColor}`,
    info,
    color: normalizedColor,
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

// Default color values
const defaultColor = "#0066FF";
const defaultRgb = hexToRgb(defaultColor);
const defaultHsl = rgbToHsl(defaultRgb.r, defaultRgb.g, defaultRgb.b);
const defaultIsDark = isColorDark(defaultColor);
const defaultColorItem = createColorItem(
  defaultColor,
  "Blue",
  "Default blue color"
);

/**
 * Main store state interface
 */
interface StoreState {
  // Color picker state
  /** Current color information as a ColorItem */
  currentColorInfo: ColorItem;
  /** Current color in HEX format (derived from currentColorInfo) */
  currentColor: string;
  /** Format to display the color */
  format: ColorFormat;
  /** Whether the current color is considered dark */
  isDark: boolean;
  /** Flag indicating HSL values have changed */
  hslChanged: boolean;
  /** Whether to automatically switch theme based on color */
  autoSwitchTheme: boolean;

  // Theme state
  /** Collection of saved colors */
  colors: ColorItem[];
  /** Recently used colors */
  recentColors: string[];
}

/**
 * Parameters for updating color values
 */
interface ColorUpdateParams {
  /** New hue value */
  hue?: number;
  /** New saturation value */
  saturation?: number;
  /** New lightness value */
  lightness?: number;
  /** New alpha value */
  alpha?: number;
  /** New base color in HEX */
  baseColor?: string;
}

/**
 * Parameters for color conversion
 */
interface ColorConversionParams {
  /** HEX color to convert */
  hex?: string;
  /** RGB color to convert */
  rgb?: { r: number; g: number; b: number };
  /** HSL color to convert */
  hsl?: { h: number; s: number; l: number };
}

/**
 * Store actions interface
 */
interface StoreActions {
  // Color picker actions
  /** Sets the base color from a HEX string */
  setBaseColor: (color: string) => void;
  /** Sets the hue component (0-360) */
  setHue: (hue: number) => void;
  /** Sets the saturation component (0-100) */
  setSaturation: (saturation: number) => void;
  /** Sets the lightness component (0-100) */
  setLightness: (lightness: number) => void;
  /** Sets the alpha/opacity (0-1) */
  setAlpha: (alpha: number) => void;
  /** Sets the display format */
  setFormat: (format: ColorFormat) => void;
  /** Sets whether to auto-switch theme based on color */
  setAutoSwitchTheme: (autoSwitch: boolean) => void;
  /** Gets the full color with alpha in HEX */
  getFullColor: () => string;
  /** Gets the color string in the current format */
  getColorString: () => string;
  /** Gets the background color with alpha support */
  getBackgroundColor: () => string;
  /** Generates a random color */
  generateRandomColor: () => void;
  /** Sets the color from a HEX string */
  setColorFromHex: (hex: string) => void;
  /** Sets the color from RGB values */
  setColorFromRgb: (r: number, g: number, b: number) => void;
  /** Sets the color from HSL values */
  setColorFromHsl: (h: number, s: number, l: number) => void;
  /** Updates the current color based on state */
  updateCurrentColor: () => void;
  /** Converts between color formats */
  convertColor: (params: ColorConversionParams) => {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
  } | null;
  /** Updates multiple color values at once */
  updateColorValues: (params: ColorUpdateParams) => void;
  /** Updates the current color info */
  updateCurrentColorInfo: (updates: Partial<ColorItem>) => void;

  // Theme actions
  /** Adds a color to the theme */
  addColor: (color: string, name?: string, info?: string) => Promise<void>;
  /** Removes a color from the theme */
  removeColor: (colorId: string) => void;
  /** Updates a color in the theme */
  updateColor: (
    colorId: string,
    updates: Partial<Omit<ColorItem, "id">>
  ) => void;
  /** Toggles favorite status of a color */
  toggleFavorite: (colorId: string) => void;
  /** Gets a color by its ID */
  getColorById: (colorId: string) => ColorItem | null;
  /** Gets a name for a color */
  getColorName: (params: { color?: string }) => Promise<string>;
  /** Sets the current color from a ColorItem */
  setCurrentColorFromItem: (colorItem: ColorItem) => void;

  // Theme management actions
  /** Adds multiple colors to the theme */
  addColorsToTheme: (params: {
    themeName: string;
    colors: Array<{ color: string; name: string }>;
  }) => void;
  /** Updates colors in the theme */
  updateTheme: (params: {
    themeName: string;
    colors: Array<{ color: string; name: string }>;
  }) => void;
  /** Resets the theme by removing all colors */
  resetTheme: () => void;
  /** Removes specific colors from the theme */
  removeColorsFromTheme: (params: { colorNames: string[] }) => void;
  /** Marks a color as favorite */
  markColorAsFavorite: (params: { colorName: string }) => void;
  /** Generates a color palette based on a base color */
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

/**
 * Main Zustand store implementation
 */
export const useStore = create<StoreState & StoreActions>((set, get) => ({
  // Initial color picker state
  currentColorInfo: defaultColorItem,
  currentColor: defaultColor,
  format: "hex" as ColorFormat,
  isDark: defaultIsDark,
  hslChanged: false,
  autoSwitchTheme: true,

  // Initial theme state
  colors: [defaultColorItem],
  recentColors: [defaultColor],

  /**
   * Converts between color formats
   * Supports conversion from HEX, RGB, or HSL to all other formats
   */
  convertColor: (params: ColorConversionParams) => {
    if (params.hex) {
      const normalizedHex = params.hex.toUpperCase();
      const rgb = hexToRgb(normalizedHex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return { hex: normalizedHex, rgb, hsl };
    } else if (params.rgb) {
      const { r, g, b } = params.rgb;
      const hex = rgbToHex(r, g, b).toUpperCase();
      const hsl = rgbToHsl(r, g, b);
      return { hex, rgb: params.rgb, hsl };
    } else if (params.hsl) {
      const { h, s, l } = params.hsl;
      const rgb = hslToRgb(h, s, l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
      return { hex, rgb, hsl: params.hsl };
    }
    return null;
  },

  /**
   * Updates the current color info with partial updates
   * Also updates the color name when color changes
   */
  updateCurrentColorInfo: (updates: Partial<ColorItem>) => {
    // First apply the updates
    set((state) => ({
      currentColorInfo: {
        ...state.currentColorInfo,
        ...updates,
      },
      // Always keep currentColor in sync with currentColorInfo.color
      ...(updates.color ? { currentColor: updates.color } : {}),
    }));

    // Update isDark if the color changed
    if (updates.color) {
      set({ isDark: isColorDark(updates.color) });

      // Get and update the color name when color changes
      // We do this outside the set function to avoid nested state updates
      get()
        .getColorName({ color: updates.color })
        .then((name) => {
          if (name) {
            // Only update the name, not the color again
            set((state) => ({
              currentColorInfo: {
                ...state.currentColorInfo,
                name,
              },
            }));
          }
        })
        .catch((error) => {
          console.error("Error getting color name:", error);
        });
    }
  },

  /**
   * Updates multiple color values at once
   * This is a unified method to update color properties and trigger appropriate updates
   * FIXED: Properly handles alpha updates
   */
  updateColorValues: (params: ColorUpdateParams) => {
    const { currentColorInfo } = get();
    const updates: Partial<ColorItem> = {};
    let hslChanged = false;
    let hasUpdates = false;

    if (params.baseColor !== undefined) {
      const normalizedColor = params.baseColor.toUpperCase();
      updates.color = normalizedColor;
      hasUpdates = true;

      // Update RGB when color changes
      const rgb = hexToRgb(normalizedColor);
      updates.rgb = rgb;

      // Update HSL when color changes
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      updates.hsl = hsl;
    }

    if (
      params.hue !== undefined ||
      params.saturation !== undefined ||
      params.lightness !== undefined
    ) {
      const newHsl = {
        h: params.hue !== undefined ? params.hue : currentColorInfo.hsl.h,
        s:
          params.saturation !== undefined
            ? params.saturation
            : currentColorInfo.hsl.s,
        l:
          params.lightness !== undefined
            ? params.lightness
            : currentColorInfo.hsl.l,
      };

      updates.hsl = newHsl;
      hslChanged = true;
      hasUpdates = true;

      // Update RGB and color when HSL changes
      const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      updates.rgb = rgb;
      updates.color = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
    }

    // Handle alpha separately to ensure it's always applied
    if (params.alpha !== undefined) {
      updates.alpha = params.alpha;
      hasUpdates = true;
    }

    // Only update state if we have changes
    if (hasUpdates) {
      set({ hslChanged });
      get().updateCurrentColorInfo(updates);
      get().updateCurrentColor();
    }
  },

  /**
   * Sets the base color from a HEX string
   */
  setBaseColor: (color: string) => {
    get().updateColorValues({ baseColor: color });
  },

  /**
   * Sets the hue component (0-360)
   */
  setHue: (hue: number) => {
    get().updateColorValues({ hue });
  },

  /**
   * Sets the saturation component (0-100)
   */
  setSaturation: (saturation: number) => {
    get().updateColorValues({ saturation });
  },

  /**
   * Sets the lightness component (0-100)
   */
  setLightness: (lightness: number) => {
    get().updateColorValues({ lightness });
  },

  /**
   * Sets the alpha/opacity (0-1)
   */
  setAlpha: (alpha: number) => {
    // Ensure alpha is within valid range
    const validAlpha = Math.max(0, Math.min(1, alpha));
    get().updateColorValues({ alpha: validAlpha });
  },

  /**
   * Sets the display format
   */
  setFormat: (format: ColorFormat) => set({ format }),

  /**
   * Sets whether to auto-switch theme based on color
   */
  setAutoSwitchTheme: (autoSwitchTheme: boolean) => set({ autoSwitchTheme }),

  /**
   * Gets the full color with alpha in HEX
   */
  getFullColor: () => {
    const { currentColorInfo } = get();
    return currentColorInfo.alpha < 1
      ? `${currentColorInfo.color}${alphaToHex(currentColorInfo.alpha)}`
      : currentColorInfo.color;
  },

  /**
   * Gets the color string in the current format
   */
  getColorString: () => {
    const { format, currentColorInfo } = get();
    const { color, rgb, alpha, hsl } = currentColorInfo;

    switch (format) {
      case "hex":
        return color;
      case "rgb":
        return alpha < 1
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case "hsl":
        return alpha < 1
          ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`
          : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      default:
        return color;
    }
  },

  /**
   * Gets the background color with alpha support
   */
  getBackgroundColor: () => {
    const { currentColorInfo } = get();
    const { rgb, alpha, color } = currentColorInfo;

    if (alpha < 1) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    return color;
  },

  /**
   * Generates a random color
   */
  generateRandomColor: () => {
    const randomHex = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    get().setColorFromHex(randomHex);
  },

  /**
   * Sets the color from a HEX string
   * Handles validation and updates all color representations
   */
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

        // Update color info
        try {
          const colorData = get().convertColor({ hex: baseHex });
          if (colorData) {
            // If we have alpha in the hex
            let alphaValue = 1;
            if (hex.length === 9) {
              const alphaHex = hex.substring(7, 9);
              alphaValue = Number.parseInt(alphaHex, 16) / 255;
            }

            get().updateCurrentColorInfo({
              color: colorData.hex,
              rgb: colorData.rgb,
              hsl: colorData.hsl,
              alpha: alphaValue,
            });

            set({ hslChanged: false });
            get().updateCurrentColor();
          }
        } catch (error) {
          console.error("Invalid hex value:", hex, error);
        }
      }
    }
  },

  /**
   * Sets the color from RGB values
   */
  setColorFromRgb: (r: number, g: number, b: number) => {
    const colorData = get().convertColor({ rgb: { r, g, b } });
    if (colorData) {
      get().updateCurrentColorInfo({
        color: colorData.hex,
        rgb: { r, g, b }, // Store the exact RGB values provided by the user
        hsl: colorData.hsl,
      });

      set({ hslChanged: false });
      get().updateCurrentColor();
    }
  },

  /**
   * Sets the color from HSL values
   * Optimized to avoid redundant calculations
   */
  setColorFromHsl: (h: number, s: number, l: number) => {
    const colorData = get().convertColor({ hsl: { h, s, l } });
    if (colorData) {
      get().updateCurrentColorInfo({
        color: colorData.hex,
        rgb: colorData.rgb,
        hsl: { h, s, l },
      });

      set({ hslChanged: false });
      get().updateCurrentColor();
    }
  },

  /**
   * Sets the current color from a ColorItem
   * This is a new method to directly set the current color from a saved color
   */
  setCurrentColorFromItem: (colorItem: ColorItem) => {
    get().updateCurrentColorInfo({
      ...colorItem,
      id: get().currentColorInfo.id, // Keep the same ID for the current color
      createdAt: get().currentColorInfo.createdAt, // Keep the same creation date
    });

    set({ hslChanged: false });
    get().updateCurrentColor();
  },

  /**
   * Updates the current color based on state
   * Now uses currentColorInfo as the source of truth
   */
  updateCurrentColor: () => {
    const { currentColorInfo, recentColors, hslChanged } = get();

    // If HSL values changed, we need to update the color and RGB values
    if (hslChanged) {
      const { hsl } = currentColorInfo;
      const newHex = hslToHex(hsl.h, hsl.s, hsl.l).toUpperCase();
      const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);

      get().updateCurrentColorInfo({
        color: newHex,
        rgb: newRgb,
      });

      set({ hslChanged: false });
      get().updateCurrentColor();
    }

    // Get the full color with alpha
    const fullColor = get().getFullColor();

    // Update current color (should match currentColorInfo.color)
    set({ currentColor: fullColor });

    // Update isDark
    set({ isDark: isColorDark(currentColorInfo.color) });

    // Update recent colors if this is a new color
    if (!recentColors.includes(fullColor)) {
      set({
        recentColors: [fullColor, ...recentColors.slice(0, 7)],
      });
    }
  },

  /**
   * Gets a name for a color using the server action
   * Simplified to remove unnecessary parameters
   */
  getColorName: async (params: { color?: string }) => {
    try {
      const { color } = params;
      const { currentColorInfo } = get();
      const finalColor = color || currentColorInfo.color;
      return await colorToName(finalColor);
    } catch (error) {
      console.error("Error getting color name:", error);
      return "";
    }
  },

  /**
   * Adds a color to the theme
   * Optimized with normalized color comparisons
   */
  addColor: async (color: string, name = "", info = "") => {
    // Normalize color to uppercase immediately
    const normalizedColor = color.toUpperCase();

    // If no name is provided, get one from the server action
    let colorName = name;
    if (!colorName) {
      colorName = await get().getColorName({ color: normalizedColor });
      if (!colorName) {
        colorName = `Color ${normalizedColor}`;
      }
    }

    const newColor = createColorItem(normalizedColor, colorName, info);

    // Check if this color already exists to avoid duplicates - using normalized comparison
    const existingColorIndex = get().colors.findIndex(
      (c) => c.color === normalizedColor
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

  /**
   * Removes a color from the theme
   */
  removeColor: (colorId: string) => {
    set((state) => ({
      colors: state.colors.filter((c) => c.id !== colorId),
    }));
  },

  /**
   * Updates a color in the theme
   */
  updateColor: (colorId: string, updates: Partial<Omit<ColorItem, "id">>) => {
    set((state) => ({
      colors: state.colors.map((c) => {
        if (c.id === colorId) {
          // Ensure color is normalized if it's being updated
          if (updates.color) {
            updates.color = updates.color.toUpperCase();
          }

          // If we're updating the color, we should also update RGB and HSL
          const updatedColor = { ...c, ...updates };

          // If color was updated but RGB wasn't, update RGB
          if (updates.color && !updates.rgb) {
            updatedColor.rgb = hexToRgb(updates.color);
          }

          // If color or RGB was updated but HSL wasn't, update HSL
          if ((updates.color || updates.rgb) && !updates.hsl) {
            const rgb = updatedColor.rgb;
            updatedColor.hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          }

          return updatedColor;
        }
        return c;
      }),
    }));
  },

  /**
   * Toggles favorite status of a color
   */
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

  /**
   * Gets a color by its ID
   */
  getColorById: (colorId: string) => {
    return get().colors.find((c) => c.id === colorId) || null;
  },

  /**
   * Adds multiple colors to the theme
   */
  addColorsToTheme: (params) => {
    const { themeName, colors } = params;

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

  /**
   * Updates colors in the theme
   */
  updateTheme: (params) => {
    const { themeName, colors } = params;
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

  /**
   * Resets the theme by removing all colors
   */
  resetTheme: () => {
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

  /**
   * Removes specific colors from the theme
   */
  removeColorsFromTheme: (params) => {
    const { colorNames } = params;
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

  /**
   * Marks a color as favorite
   */
  markColorAsFavorite: (params) => {
    const { colorName } = params;
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

  /**
   * Generates a color palette based on a base color
   * Supports various palette types: analogous, complementary, triadic, tetradic, monochromatic
   */
  generateColorPalette: async (params) => {
    const { baseColor, paletteType, count = 5 } = params;
    const store = get();
    const normalizedBaseColor = baseColor.toUpperCase();

    const rgb = hexToRgb(normalizedBaseColor);
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
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
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
        ).toUpperCase();
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
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
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
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
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
          const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
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
    const baseName = await colorToName(normalizedBaseColor);
    palette.unshift({
      color: normalizedBaseColor,
      name: baseName || `Color ${normalizedBaseColor}`,
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
      baseColor: normalizedBaseColor,
      paletteType,
      palette,
    };
  },
}));

/**
 * Hook to handle theme switching based on color
 * @param initialColor - Initial color to set
 */
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

/**
 * Calculates the complementary color (opposite on the color wheel)
 * @param hexColor - HEX color to find complement for
 * @returns Complementary color in HEX format
 */
export function calculateComplementary(hexColor: string): string {
  const normalizedColor = hexColor.toUpperCase();
  const rgb = hexToRgb(normalizedColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Complementary color is 180 degrees away on the color wheel
  const complementaryHue = (hsl.h + 180) % 360;

  // Convert back to RGB and then to hex
  const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
  return rgbToHex(
    complementaryRgb.r,
    complementaryRgb.g,
    complementaryRgb.b
  ).toUpperCase();
}

/**
 * Calculates analogous colors (adjacent on the color wheel)
 * @param hexColor - HEX color to find analogous colors for
 * @param hsl - Optional HSL values if already calculated
 * @returns Array of analogous colors in HEX format
 */
export function calculateAnalogous(
  hexColor: string,
  hsl?: { h: number; s: number; l: number }
): string[] {
  const normalizedColor = hexColor.toUpperCase();

  // If HSL is not provided, calculate it from the hex color
  if (!hsl) {
    const rgb = hexToRgb(normalizedColor);
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  // Analogous colors are 30 degrees away on either side
  const hue1 = (hsl.h + 30) % 360;
  const hue2 = (hsl.h + 330) % 360; // equivalent to (hsl.h - 30 + 360) % 360

  // Convert to RGB and then to hex
  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);

  return [
    rgbToHex(rgb1.r, rgb1.g, rgb1.b).toUpperCase(),
    rgbToHex(rgb2.r, rgb2.g, rgb2.b).toUpperCase(),
  ];
}

/**
 * Calculates triadic colors (evenly spaced around the color wheel)
 * @param hexColor - HEX color to find triadic colors for
 * @returns Array of triadic colors in HEX format
 */
export function calculateTriadic(hexColor: string): string[] {
  const normalizedColor = hexColor.toUpperCase();
  const rgb = hexToRgb(normalizedColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Triadic colors are 120 degrees apart
  const hue1 = (hsl.h + 120) % 360;
  const hue2 = (hsl.h + 240) % 360;

  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);

  return [
    rgbToHex(rgb1.r, rgb1.g, rgb1.b).toUpperCase(),
    rgbToHex(rgb2.r, rgb2.g, rgb2.b).toUpperCase(),
  ];
}

/**
 * Calculates tetradic colors (rectangle on the color wheel)
 * @param hexColor - HEX color to find tetradic colors for
 * @returns Array of tetradic colors in HEX format
 */
export function calculateTetradic(hexColor: string): string[] {
  const normalizedColor = hexColor.toUpperCase();
  const rgb = hexToRgb(normalizedColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Tetradic colors are in a rectangle on the color wheel
  const hue1 = (hsl.h + 90) % 360;
  const hue2 = (hsl.h + 180) % 360;
  const hue3 = (hsl.h + 270) % 360;

  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);
  const rgb3 = hslToRgb(hue3, hsl.s, hsl.l);

  return [
    rgbToHex(rgb1.r, rgb1.g, rgb1.b).toUpperCase(),
    rgbToHex(rgb2.r, rgb2.g, rgb2.b).toUpperCase(),
    rgbToHex(rgb3.r, rgb3.g, rgb3.b).toUpperCase(),
  ];
}
