"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import type { ColorItem } from "@/store";

// Define the store type based on what's returned from useStore
type StoreValues = {
  currentColorInfo: ColorItem;
  currentColor: string;
  getFullColor: () => string;
  generateRandomColor: () => void;
  setColorFromHex: (hex: string) => void;
  setColorFromRgb: (r: number, g: number, b: number) => void;
  setColorFromHsl: (h: number, s: number, l: number) => void;
  updateColorValues: (updates: {
    hue?: number;
    saturation?: number;
    lightness?: number;
    alpha?: number;
    baseColor?: string;
  }) => void;
  getColorName: (params: { color?: string }) => Promise<string>;
  colors: ColorItem[];
  removeColor: (id: string) => void;
  addColor: (color: string, name: string, info?: string) => Promise<void>;
  setCurrentColorFromItem: (colorItem: ColorItem) => void;
};

// Update the ColorPickerContextType to use the StoreValues type
type ColorPickerContextType = {
  // Local state for immediate UI feedback
  localHue: number;
  localSaturation: number;
  localLightness: number;
  localAlpha: number;
  setLocalHue: (value: number) => void;
  setLocalSaturation: (value: number) => void;
  setLocalLightness: (value: number) => void;
  setLocalAlpha: (value: number) => void;

  // Input values
  hexValue: string;
  rValue: string;
  gValue: string;
  bValue: string;
  hValue: string;
  sValue: string;
  lValue: string;
  setHexValue: (value: string) => void;
  setRValue: (value: string) => void;
  setGValue: (value: string) => void;
  setBValue: (value: string) => void;
  setHValue: (value: string) => void;
  setSValue: (value: string) => void;
  setLValue: (value: string) => void;

  // Error states
  hexError: string;
  rError: string;
  gError: string;
  bError: string;
  hError: string;
  sError: string;
  lError: string;
  setHexError: (value: string) => void;
  setRError: (value: string) => void;
  setGError: (value: string) => void;
  setBError: (value: string) => void;
  setHError: (value: string) => void;
  setSError: (value: string) => void;
  setLError: (value: string) => void;

  // Color name
  colorName: string;
  setColorName: (value: string) => void;

  // Wheel interaction state
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;

  // Store values (from Zustand)
  storeValues: StoreValues;
};

// Create context with a default undefined value
const ColorPickerContext = createContext<ColorPickerContextType | undefined>(
  undefined
);

// Provider component
export function ColorPickerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeValues = useStore();
  const { currentColorInfo, getFullColor } = storeValues;
  const { hsl, rgb, alpha } = currentColorInfo;

  // Local state for immediate UI feedback
  const [localHue, setLocalHue] = useState(hsl.h);
  const [localSaturation, setLocalSaturation] = useState(hsl.s);
  const [localLightness, setLocalLightness] = useState(hsl.l);
  const [localAlpha, setLocalAlpha] = useState(alpha);

  // Input values
  const [hexValue, setHexValue] = useState(getFullColor());
  const [rValue, setRValue] = useState(rgb.r.toString());
  const [gValue, setGValue] = useState(rgb.g.toString());
  const [bValue, setBValue] = useState(rgb.b.toString());
  const [hValue, setHValue] = useState(hsl.h.toString());
  const [sValue, setSValue] = useState(hsl.s.toString());
  const [lValue, setLValue] = useState(hsl.l.toString());

  // Error states
  const [hexError, setHexError] = useState("");
  const [rError, setRError] = useState("");
  const [gError, setGError] = useState("");
  const [bError, setBError] = useState("");
  const [hError, setHError] = useState("");
  const [sError, setSError] = useState("");
  const [lError, setLError] = useState("");

  // Color name
  const [colorName, setColorName] = useState(currentColorInfo.name || "");

  // Wheel interaction state
  const [isDragging, setIsDragging] = useState(false);

  // Update local state when store values change
  useEffect(() => {
    setLocalHue(hsl.h);
    setLocalSaturation(hsl.s);
    setLocalLightness(hsl.l);
    setLocalAlpha(alpha);
  }, [hsl.h, hsl.s, hsl.l, alpha]);

  // Update input values when color changes from outside
  useEffect(() => {
    setHexValue(getFullColor());
    setRValue(rgb.r.toString());
    setGValue(rgb.g.toString());
    setBValue(rgb.b.toString());
    setHValue(hsl.h.toString());
    setSValue(hsl.s.toString());
    setLValue(hsl.l.toString());

    // Update color name
    setColorName(currentColorInfo.name || "");

    // Clear all errors when color changes
    setHexError("");
    setRError("");
    setGError("");
    setBError("");
    setHError("");
    setSError("");
    setLError("");
  }, [
    getFullColor,
    rgb.r,
    rgb.g,
    rgb.b,
    hsl.h,
    hsl.s,
    hsl.l,
    currentColorInfo.name,
  ]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<ColorPickerContextType>(
    () => ({
      localHue,
      localSaturation,
      localLightness,
      localAlpha,
      setLocalHue,
      setLocalSaturation,
      setLocalLightness,
      setLocalAlpha,

      hexValue,
      rValue,
      gValue,
      bValue,
      hValue,
      sValue,
      lValue,
      setHexValue,
      setRValue,
      setGValue,
      setBValue,
      setHValue,
      setSValue,
      setLValue,

      hexError,
      rError,
      gError,
      bError,
      hError,
      sError,
      lError,
      setHexError,
      setRError,
      setGError,
      setBError,
      setHError,
      setSError,
      setLError,

      colorName,
      setColorName,

      isDragging,
      setIsDragging,

      storeValues,
    }),
    [
      localHue,
      localSaturation,
      localLightness,
      localAlpha,
      hexValue,
      rValue,
      gValue,
      bValue,
      hValue,
      sValue,
      lValue,
      hexError,
      rError,
      gError,
      bError,
      hError,
      sError,
      lError,
      colorName,
      isDragging,
      storeValues,
    ]
  );

  return (
    <ColorPickerContext.Provider value={contextValue}>
      {children}
    </ColorPickerContext.Provider>
  );
}

// Custom hook to use the context
export function useColorPicker() {
  const context = useContext(ColorPickerContext);
  if (context === undefined) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }
  return context;
}
