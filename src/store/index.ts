"use client";

import { create } from "zustand";
import { useTheme } from "next-themes";
import { useEffect } from "react";

// Color utility functions
export const hslToRgb = (
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

export const alphaToHex = (alpha: number): string => {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
};

export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number; a?: number } => {
  // Remove the # if present
  hex = hex.replace(/^#/, "");

  // Ensure we have at least 6 characters for a valid hex color
  if (!/^[0-9A-Fa-f]{6,8}$/.test(hex)) {
    return { r: 0, g: 0, b: 0 }; // Return black for invalid hex
  }

  // Parse the hex values
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  // Check if we have an alpha channel
  let a: number | undefined = undefined;
  if (hex.length >= 8) {
    a = Number.parseInt(hex.slice(6, 8), 16) / 255;
  }

  return { r, g, b, a };
};

export const rgbToHsl = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hexToHsl = (
  hex: string
): { h: number; s: number; l: number; a?: number } => {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { ...hsl, a: rgb.a };
};

// Calculate luminance for WCAG contrast
export const calculateLuminance = (r: number, g: number, b: number): number => {
  // Convert RGB to linear values
  const rsrgb = r / 255;
  const gsrgb = g / 255;
  const bsrgb = b / 255;

  // Convert to linear RGB
  const rlinear =
    rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
  const glinear =
    gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
  const blinear =
    bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rlinear + 0.7152 * glinear + 0.0722 * blinear;
};

export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Determine if a color is dark (for theme switching)
export const isColorDark = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
  // Using 0.5 as threshold - colors with luminance < 0.5 are considered dark
  return luminance < 0.5;
};

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

// Helper function to generate a simple color name based on HSL values
function generateColorName(h: number, s: number, l: number): string {
  // Determine hue name
  let hueName = "";
  if (h >= 0 && h < 30) hueName = "Red";
  else if (h >= 30 && h < 60) hueName = "Orange";
  else if (h >= 60 && h < 90) hueName = "Yellow";
  else if (h >= 90 && h < 150) hueName = "Green";
  else if (h >= 150 && h < 210) hueName = "Cyan";
  else if (h >= 210 && h < 270) hueName = "Blue";
  else if (h >= 270 && h < 330) hueName = "Purple";
  else hueName = "Pink";

  // Determine saturation modifier
  let satModifier = "";
  if (s < 30) satModifier = "Grayish ";
  else if (s > 80) satModifier = "Vibrant ";

  // Determine lightness modifier
  let lightModifier = "";
  if (l < 30) lightModifier = "Dark ";
  else if (l > 70) lightModifier = "Light ";

  return `${lightModifier}${satModifier}${hueName}`;
}

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
  lastColorChangeTime: number;

  // Theme state
  colors: ColorItem[];
  recentColors: string[];
}

// Define the store actions
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

  // Theme actions
  addColor: (color: string, name?: string, info?: string) => void;
  removeColor: (colorId: string) => void;
  updateColor: (
    colorId: string,
    updates: Partial<Omit<ColorItem, "id">>
  ) => void;
  toggleFavorite: (colorId: string) => void;
  getColorById: (colorId: string) => ColorItem | null;
}

// Create the unified store
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
  lastColorChangeTime: Date.now(),

  // Initial theme state
  colors: [createColorItem(defaultColor, "Blue", "Default blue color")],
  recentColors: [defaultColor],

  // Color picker actions
  setBaseColor: (color: string) => {
    set({ baseColor: color });
    get().updateCurrentColor();
  },

  setHue: (hue: number) => {
    set({ hue, hslChanged: true });
    get().updateCurrentColor();
  },

  setSaturation: (saturation: number) => {
    set({ saturation, hslChanged: true });
    get().updateCurrentColor();
  },

  setLightness: (lightness: number) => {
    set({ lightness, hslChanged: true });
    get().updateCurrentColor();
  },

  setAlpha: (alpha: number) => {
    set({ alpha });
    get().updateCurrentColor();
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
      rgb: { r, g, b },
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
      lastColorChangeTime,
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

    const now = Date.now();
    set({
      currentColor: newCurrentColor,
      rgb,
      isDark: dark,
      recentColors: updatedRecentColors,
      lastColorChangeTime: now,
    });

    // Add color to history after a delay (to avoid adding too many colors during rapid changes)
    // We use setTimeout to debounce the color addition
    const DEBOUNCE_TIME = 500; // 1 second
    setTimeout(() => {
      // Only add the color if it's still the current one after the delay
      if (get().lastColorChangeTime === now) {
        get().addColor(newBaseColor);
      }
    }, DEBOUNCE_TIME);
  },

  // Theme actions
  addColor: (color: string, name = "", info = "") => {
    // If no name is provided, generate one based on HSL values
    if (!name) {
      const { hue, saturation, lightness } = get();
      name = generateColorName(hue, saturation, lightness);
    }

    const newColor = createColorItem(color, name, info);

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
}));

// Helper function to generate a simple color name based on HSL values
// function generateColorName(h: number, s: number, l: number): string {
//   // Determine hue name
//   let hueName = ""
//   if (h >= 0 && h < 30) hueName = "Red"
//   else if (h >= 30 && h < 60) hueName = "Orange"
//   else if (h >= 60 && h < 90) hueName = "Yellow"
//   else if (h >= 90 && h < 150) hueName = "Green"
//   else if (h >= 150 && h < 210) hueName = "Cyan"
//   else if (h >= 210 && h < 270) hueName = "Blue"
//   else if (h >= 270 && h < 330) hueName = "Purple"
//   else hueName = "Pink"

//   // Determine saturation modifier
//   let satModifier = ""
//   if (s < 30) satModifier = "Grayish "
//   else if (s > 80) satModifier = "Vibrant "

//   // Determine lightness modifier
//   let lightModifier = ""
//   if (l < 30) lightModifier = "Dark "
//   else if (l > 70) lightModifier = "Light "

//   return `${lightModifier}${satModifier}${hueName}`
// }

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
