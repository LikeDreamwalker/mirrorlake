"use client";

import { createStore } from "zustand/vanilla";
import { toast } from "sonner";
import {
  alphaToHex,
  hexToRgb,
  isColorDark,
  rgbToHsl,
  rgbToHex,
  hslToHex,
  hslToRgb,
} from "@mirrorlake/color-tools";
import { colorToName } from "@/app/actions/color";

export type ColorFormat = "hex" | "rgb" | "hsl";

export interface ColorItem {
  id: string;
  name: string;
  info?: string;
  color: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  alpha: number;
  createdAt: Date;
  favorite?: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const createColorItem = (
  color: string,
  name = "",
  info = ""
): ColorItem => {
  const normalizedColor = color.toUpperCase();
  const rgb = hexToRgb(normalizedColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    id: generateId(),
    name: name || `Color ${normalizedColor}`,
    info,
    color: normalizedColor,
    rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
    hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
    alpha: 1,
    createdAt: new Date(),
    favorite: false,
  };
};

// Default color values
const defaultBlueRibbonColor = "#0066ff";
const defaultOrangeRedColor = "#FF4500";
const defaultElectricBlueColor = "#00BBFF";
const defaultDeepBlackColor = "#121212";
const defaultPureWhiteColor = "#FFFFFF";

const blueRibbonItem = createColorItem(
  defaultBlueRibbonColor,
  "Blue Ribbon",
  "Default blue color"
);
const orangeRedItem = createColorItem(
  defaultOrangeRedColor,
  "Red Dit",
  "Vibrant orange-red color"
);
const electricBlueItem = createColorItem(
  defaultElectricBlueColor,
  "Hawaii Morning",
  "Bright electric blue color"
);
const deepBlackItem = createColorItem(
  defaultDeepBlackColor,
  "Dark Tone Ink",
  "Rich deep black color"
);
const pureWhiteItem = createColorItem(
  defaultPureWhiteColor,
  "White",
  "Clean pure white color"
);

interface StoreState {
  currentColorInfo: ColorItem;
  currentColor: string;
  format: ColorFormat;
  isDark: boolean;
  hslChanged: boolean;
  autoSwitchTheme: boolean;
  colors: ColorItem[];
  recentColors: string[];
}

interface ColorUpdateParams {
  hue?: number;
  saturation?: number;
  lightness?: number;
  alpha?: number;
  baseColor?: string;
}

interface ColorConversionParams {
  hex?: string;
  rgb?: { r: number; g: number; b: number };
  hsl?: { h: number; s: number; l: number };
}

interface StoreActions {
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
  convertColor: (params: ColorConversionParams) => {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
  } | null;
  updateColorValues: (params: ColorUpdateParams) => void;
  updateCurrentColorInfo: (updates: Partial<ColorItem>) => void;
  addColor: (color: string, name?: string, info?: string) => Promise<void>;
  removeColor: (colorId: string) => void;
  updateColor: (
    colorId: string,
    updates: Partial<Omit<ColorItem, "id">>
  ) => void;
  toggleFavorite: (colorId: string) => void;
  getColorById: (colorId: string) => ColorItem | null;
  getColorName: (params: { color?: string }) => Promise<string>;
  setCurrentColorFromItem: (colorItem: ColorItem) => void;
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

export type ColorStore = StoreState & StoreActions;

export const createColorStore = (initialColor?: string) => {
  // Use provided initial color or fallback to default
  const color = initialColor || defaultBlueRibbonColor;
  const initialColorItem = createColorItem(
    color,
    color === defaultBlueRibbonColor ? "Blue Ribbon" : color,
    color === defaultBlueRibbonColor
      ? "Default blue color"
      : "Color from search param"
  );

  return createStore<ColorStore>((set, get) => ({
    currentColorInfo: initialColorItem,
    currentColor: color.toUpperCase(),
    format: "hex" as ColorFormat,
    isDark: isColorDark(color),
    hslChanged: false,
    autoSwitchTheme: true,
    colors: [
      initialColorItem,
      ...(color === defaultBlueRibbonColor
        ? [orangeRedItem, electricBlueItem, deepBlackItem, pureWhiteItem]
        : []),
    ],
    recentColors: [color.toUpperCase()],

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

    updateCurrentColorInfo: (updates: Partial<ColorItem>) => {
      set((state) => ({
        currentColorInfo: {
          ...state.currentColorInfo,
          ...updates,
        },
        ...(updates.color ? { currentColor: updates.color } : {}),
      }));

      if (updates.color) {
        set({ isDark: isColorDark(updates.color) });
        get()
          .getColorName({ color: updates.color })
          .then((name) => {
            if (name) {
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

    updateColorValues: (params: ColorUpdateParams) => {
      const { currentColorInfo } = get();
      const updates: Partial<ColorItem> = {};
      let hslChanged = false;
      let hasUpdates = false;

      if (params.baseColor !== undefined) {
        const normalizedColor = params.baseColor.toUpperCase();
        updates.color = normalizedColor;
        hasUpdates = true;
        const rgb = hexToRgb(normalizedColor);
        updates.rgb = rgb;
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

        const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        updates.rgb = rgb;
        updates.color = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
      }

      if (params.alpha !== undefined) {
        updates.alpha = params.alpha;
        hasUpdates = true;
      }

      if (hasUpdates) {
        set({ hslChanged });
        get().updateCurrentColorInfo(updates);
        get().updateCurrentColor();
      }
    },

    setBaseColor: (color: string) => {
      get().updateColorValues({ baseColor: color });
    },

    setHue: (hue: number) => {
      get().updateColorValues({ hue });
    },

    setSaturation: (saturation: number) => {
      get().updateColorValues({ saturation });
    },

    setLightness: (lightness: number) => {
      get().updateColorValues({ lightness });
    },

    setAlpha: (alpha: number) => {
      const validAlpha = Math.max(0, Math.min(1, alpha));
      get().updateColorValues({ alpha: validAlpha });
    },

    setFormat: (format: ColorFormat) => set({ format }),

    setAutoSwitchTheme: (autoSwitchTheme: boolean) => set({ autoSwitchTheme }),

    getFullColor: () => {
      const { currentColorInfo } = get();
      return currentColorInfo.alpha < 1
        ? `${currentColorInfo.color}${alphaToHex(currentColorInfo.alpha)}`
        : currentColorInfo.color;
    },

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

    getBackgroundColor: () => {
      const { currentColorInfo } = get();
      const { rgb, alpha, color } = currentColorInfo;
      if (alpha < 1) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      }
      return color;
    },

    generateRandomColor: () => {
      const randomHex = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
      get().setColorFromHex(randomHex);
    },

    setColorFromHex: (hex: string) => {
      if (/^#?[0-9A-Fa-f]{0,8}$/i.test(hex)) {
        if (!hex.startsWith("#")) {
          hex = `#${hex}`;
        }
        if (hex.length >= 7) {
          const baseHex = hex.substring(0, 7).toUpperCase();
          try {
            const colorData = get().convertColor({ hex: baseHex });
            if (colorData) {
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

    setColorFromRgb: (r: number, g: number, b: number) => {
      const colorData = get().convertColor({ rgb: { r, g, b } });
      if (colorData) {
        get().updateCurrentColorInfo({
          color: colorData.hex,
          rgb: { r, g, b },
          hsl: colorData.hsl,
        });
        set({ hslChanged: false });
        get().updateCurrentColor();
      }
    },

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

    setCurrentColorFromItem: (colorItem: ColorItem) => {
      get().updateCurrentColorInfo({
        ...colorItem,
        id: get().currentColorInfo.id,
        createdAt: get().currentColorInfo.createdAt,
      });
      set({ hslChanged: false });
      get().updateCurrentColor();
    },

    updateCurrentColor: () => {
      const { currentColorInfo, recentColors, hslChanged } = get();
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
      const fullColor = get().getFullColor();
      set({ currentColor: fullColor });
      set({ isDark: isColorDark(currentColorInfo.color) });
      if (!recentColors.includes(fullColor)) {
        set({
          recentColors: [fullColor, ...recentColors.slice(0, 7)],
        });
      }
    },

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

    addColor: async (color: string, name = "", info = "") => {
      const normalizedColor = color.toUpperCase();
      let colorName = name;
      if (!colorName) {
        colorName = await get().getColorName({ color: normalizedColor });
        if (!colorName) {
          colorName = `Color ${normalizedColor}`;
        }
      }
      const newColor = createColorItem(normalizedColor, colorName, info);
      const existingColorIndex = get().colors.findIndex(
        (c) => c.color === normalizedColor
      );
      if (existingColorIndex !== -1) {
        set((state) => {
          const updatedColors = [...state.colors];
          const [existingColor] = updatedColors.splice(existingColorIndex, 1);
          return {
            colors: [existingColor, ...updatedColors],
          };
        });
      } else {
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
            if (updates.color) {
              updates.color = updates.color.toUpperCase();
            }
            const updatedColor = { ...c, ...updates };
            if (updates.color && !updates.rgb) {
              updatedColor.rgb = hexToRgb(updates.color);
            }
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

    addColorsToTheme: (params) => {
      const { themeName, colors } = params;
      colors.forEach((colorItem) => {
        get().addColor(colorItem.color, colorItem.name);
      });
      if (typeof toast !== "undefined") {
        toast.success(`Added ${colors.length} colors to "${themeName}" theme`);
      }
    },

    updateTheme: (params) => {
      const { themeName, colors } = params;
      const store = get();
      colors.forEach((colorItem) => {
        const existingColors = store.colors.filter(
          (c) => c.name === colorItem.name
        );
        existingColors.forEach((color) => {
          store.removeColor(color.id);
        });
        store.addColor(colorItem.color, colorItem.name);
      });
      if (typeof toast !== "undefined") {
        toast.success(
          `Updated "${themeName}" theme with ${colors.length} colors`
        );
      }
    },

    resetTheme: () => {
      const store = get();
      const colorIds = store.colors.map((color) => color.id);
      colorIds.forEach((id) => {
        store.removeColor(id);
      });
      if (typeof toast !== "undefined") {
        toast.info("Theme has been reset");
      }
    },

    removeColorsFromTheme: (params) => {
      const { colorNames } = params;
      const store = get();
      let removedCount = 0;
      colorNames.forEach((name) => {
        const colorsToRemove = store.colors.filter(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        colorsToRemove.forEach((color) => {
          store.removeColor(color.id);
          removedCount++;
        });
      });
      if (typeof toast !== "undefined") {
        toast.info(`Removed ${removedCount} colors from the theme`);
      }
    },

    markColorAsFavorite: (params) => {
      const { colorName } = params;
      const store = get();
      const color = store.colors.find(
        (c) => c.name.toLowerCase() === colorName.toLowerCase()
      );
      if (color) {
        store.toggleFavorite(color.id);
        if (typeof toast !== "undefined") {
          toast.success(`Marked "${colorName}" as favorite`);
        }
      } else {
        if (typeof toast !== "undefined") {
          toast.error(`Color "${colorName}" not found in the theme`);
        }
      }
    },

    generateColorPalette: async (params) => {
      const { baseColor, paletteType, count = 5 } = params;
      const store = get();
      const normalizedBaseColor = baseColor.toUpperCase();
      const rgb = hexToRgb(normalizedBaseColor);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      let palette: Array<{ color: string; name: string }> = [];

      switch (paletteType) {
        case "analogous": {
          const colors = [];
          for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            const newHue = (hsl.h + i * 30 + 360) % 360;
            const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
            const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
            const name = await colorToName(newHex);
            colors.push({ color: newHex, name: name || `Color ${newHex}` });
          }
          palette = colors;
          break;
        }
        case "complementary": {
          const complementaryHue = (hsl.h + 180) % 360;
          const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
          const complementaryHex = rgbToHex(
            complementaryRgb.r,
            complementaryRgb.g,
            complementaryRgb.b
          ).toUpperCase();
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
          const colors = [];
          for (let i = 1; i <= 2; i++) {
            const newHue = (hsl.h + i * 120) % 360;
            const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
            const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
            const name = await colorToName(newHex);
            colors.push({ color: newHex, name: name || `Color ${newHex}` });
          }
          palette = colors;
          break;
        }
        case "tetradic": {
          const colors = [];
          for (let i = 1; i <= 3; i++) {
            const newHue = (hsl.h + i * 90) % 360;
            const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
            const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
            const name = await colorToName(newHex);
            colors.push({ color: newHex, name: name || `Color ${newHex}` });
          }
          palette = colors;
          break;
        }
        case "monochromatic": {
          const colors = [];
          for (let i = 1; i <= Math.min(count, 4); i++) {
            const newLightness = Math.max(
              10,
              Math.min(90, hsl.l + (i % 2 === 0 ? i * 10 : -i * 10))
            );
            const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);
            const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase();
            const name = await colorToName(newHex);
            colors.push({ color: newHex, name: name || `Color ${newHex}` });
          }
          palette = colors;
          break;
        }
      }

      const baseName = await colorToName(normalizedBaseColor);
      palette.unshift({
        color: normalizedBaseColor,
        name: baseName || `Color ${normalizedBaseColor}`,
      });

      palette = palette.slice(0, count);

      for (const colorItem of palette) {
        await store.addColor(colorItem.color, colorItem.name);
      }

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
};
