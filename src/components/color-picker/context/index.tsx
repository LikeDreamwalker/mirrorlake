"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useRef,
} from "react";
import { useTheme } from "next-themes"; // Import useTheme from next-themes

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

interface ColorPickerContextType {
  // Color values
  baseColor: string;
  currentColor: string;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  rgb: { r: number; g: number; b: number };
  format: ColorFormat;
  recentColors: string[];
  isDark: boolean; // Add a flag to indicate if the current color is dark

  // Setters
  setBaseColor: (color: string) => void;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  setFormat: (format: ColorFormat) => void;

  // Utility functions
  getFullColor: () => string;
  getColorString: () => string;
  getBackgroundColor: () => string;
  generateRandomColor: () => void;
  setColorFromHex: (hex: string) => void;
  setColorFromRgb: (r: number, g: number, b: number) => void;
  setColorFromHsl: (h: number, s: number, l: number) => void;
  hexToRgb: (hex: string) => { r: number; g: number; b: number; a?: number };
}

const ColorPickerContext = createContext<ColorPickerContextType | undefined>(
  undefined
);

export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);
  if (context === undefined) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }
  return context;
};

interface ColorPickerProviderProps {
  children: ReactNode;
  initialColor?: string;
  autoSwitchTheme?: boolean; // Add option to enable/disable auto theme switching
}

export const ColorPickerProvider: React.FC<ColorPickerProviderProps> = ({
  children,
  initialColor = "#6366F1",
  autoSwitchTheme = true, // Default to true
}) => {
  const { setTheme } = useTheme(); // Get setTheme from next-themes
  const [baseColor, setBaseColor] = useState(initialColor);
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [hue, setHue] = useState(240);
  const [saturation, setSaturation] = useState(89);
  const [lightness, setLightness] = useState(67);
  const [alpha, setAlpha] = useState(1);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [recentColors, setRecentColors] = useState<string[]>([initialColor]);
  const [isDark, setIsDark] = useState(false);

  // Add this ref to track HSL changes
  const hslChanged = useRef(false);

  // Replace the entire useEffect for color updates with this simpler approach
  useEffect(() => {
    // When HSL values change, update the baseColor (our source of truth)
    if (hslChanged.current) {
      const newHex = hslToHex(hue, saturation, lightness);
      setBaseColor(newHex);
      hslChanged.current = false;
    }

    // Update currentColor from baseColor and alpha
    const newCurrentColor =
      alpha < 1 ? `${baseColor}${alphaToHex(alpha)}` : baseColor;

    // Only update if it's different
    if (currentColor !== newCurrentColor) {
      setCurrentColor(newCurrentColor);

      // Update recent colors if this is a new color
      if (!recentColors.includes(newCurrentColor)) {
        setRecentColors((prev) => [newCurrentColor, ...prev.slice(0, 7)]);
      }

      // Check if the color is dark and update the isDark state
      const dark = isColorDark(baseColor);
      setIsDark(dark);

      setTheme(dark ? "dark" : "light");
    }
  }, [
    hue,
    saturation,
    lightness,
    alpha,
    baseColor,
    currentColor,
    recentColors,
    autoSwitchTheme,
    setTheme,
  ]);

  // Update the setHue, setSaturation, and setLightness functions
  const setHueValue = (h: number) => {
    hslChanged.current = true;
    setHue(h);
  };

  const setSaturationValue = (s: number) => {
    hslChanged.current = true;
    setSaturation(s);
  };

  const setLightnessValue = (l: number) => {
    hslChanged.current = true;
    setLightness(l);
  };

  // Update the setColorFromHex function to be the primary way to set color
  const setColorFromHex = (hex: string) => {
    // Basic validation for hex format
    if (/^#?[0-9A-Fa-f]{0,8}$/i.test(hex)) {
      // Ensure the hex starts with #
      if (!hex.startsWith("#")) {
        hex = `#${hex}`;
      }

      // Only process complete hex values
      if (hex.length >= 7) {
        const baseHex = hex.substring(0, 7).toUpperCase();
        setBaseColor(baseHex);

        // Update HSL values without triggering another update
        try {
          const rgb = hexToRgb(baseHex);
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

          // Update HSL without triggering the hslChanged flag
          hslChanged.current = false;
          setHue(hsl.h);
          setSaturation(hsl.s);
          setLightness(hsl.l);

          // If we have alpha in the hex
          if (hex.length === 9) {
            const alphaHex = hex.substring(7, 9);
            const alphaValue = Number.parseInt(alphaHex, 16) / 255;
            setAlpha(alphaValue);
          } else {
            setAlpha(1); // Reset alpha if no alpha in hex
          }
        } catch (error) {
          console.log("Invalid hex value:", hex, error);
        }
      }
    }
  };

  // Update the setColorFromRgb function
  const setColorFromRgb = (r: number, g: number, b: number) => {
    // Convert RGB directly to hex and update the source of truth
    const hex = rgbToHex(r, g, b);
    setBaseColor(hex);

    // Update HSL values without triggering another update
    const hsl = rgbToHsl(r, g, b);
    hslChanged.current = false;
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  };

  // Set color from HSL values
  const setColorFromHsl = (h: number, s: number, l: number) => {
    setHue(h);
    setSaturation(s);
    setLightness(l);
  };

  // Get color string based on format
  const getColorString = (): string => {
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
  };

  // Get background color with alpha support
  const getBackgroundColor = (): string => {
    if (alpha < 1) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    return currentColor;
  };

  // Initialize from initialColor if provided
  useEffect(() => {
    if (initialColor) {
      setColorFromHex(initialColor);
    }
  }, [initialColor]);

  // RGB values derived from HSL
  const rgb = hslToRgb(hue, saturation, lightness);

  const getFullColor = () => {
    return alpha < 1 ? `${baseColor}${alphaToHex(alpha)}` : baseColor;
  };

  const generateRandomColor = () => {
    const randomHex = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    setColorFromHex(randomHex);
  };

  // Update the value object to use the new setter functions
  const value = {
    baseColor,
    currentColor,
    hue,
    saturation,
    lightness,
    alpha,
    rgb,
    format,
    recentColors,
    isDark,
    setBaseColor,
    setHue: setHueValue,
    setSaturation: setSaturationValue,
    setLightness: setLightnessValue,
    setAlpha,
    setFormat,
    getFullColor,
    getColorString,
    getBackgroundColor,
    generateRandomColor,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    hexToRgb,
  };

  return (
    <ColorPickerContext.Provider value={value}>
      <div
        className="size-full transition-all duration-500"
        style={{
          backgroundColor: currentColor, // Apply the current color with 12.5% opacity (20 in hex)
        }}
      >
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
};
