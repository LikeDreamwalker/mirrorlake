"use client";

import type React from "react";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { useColorPicker } from "./context";
import { debounce } from "@/lib/utils";

// Debounce timeout in milliseconds
const DEBOUNCE_TIMEOUT = 50;

export function ColorSliders() {
  const {
    localLightness,
    localAlpha,
    setLocalLightness,
    setLocalAlpha,
    rValue,
    gValue,
    bValue,
    hValue,
    sValue,
    lValue,
    setRValue,
    setGValue,
    setBValue,
    setHValue,
    setSValue,
    setLValue,
    rError,
    gError,
    bError,
    hError,
    sError,
    lError,
    setRError,
    setGError,
    setBError,
    setHError,
    setSError,
    setLError,
    storeValues,
  } = useColorPicker();

  const {
    rgb,
    hue,
    saturation,
    lightness,
    updateColorValues,
    setColorFromRgb,
    setColorFromHsl,
  } = storeValues;

  // Create debounced update function
  const debouncedUpdateColor = useCallback(
    debounce(
      (updates: {
        hue?: number;
        saturation?: number;
        lightness?: number;
        alpha?: number;
      }) => {
        updateColorValues(updates);
      },
      DEBOUNCE_TIMEOUT
    ),
    [updateColorValues]
  );

  // Handle lightness slider change
  const handleLightnessChange = (value: number[]) => {
    setLocalLightness(value[0]);
    debouncedUpdateColor({ lightness: value[0] });
  };

  // Handle alpha slider change
  const handleAlphaChange = (value: number[]) => {
    setLocalAlpha(value[0]);
    debouncedUpdateColor({ alpha: value[0] });
  };

  // Helper to render error message
  const renderErrorMessage = (error: string) => {
    if (!error) return null;
    return (
      <div className="text-destructive text-xs flex items-center mt-1">
        <AlertCircle className="h-3 w-3 mr-1" />
        {error}
      </div>
    );
  };

  // Handle RGB input changes
  const handleRgbChange = (component: "r" | "g" | "b", value: string) => {
    // Update the local state
    if (component === "r") {
      setRValue(value);
      setRError("");
    }
    if (component === "g") {
      setGValue(value);
      setGError("");
    }
    if (component === "b") {
      setBValue(value);
      setBError("");
    }

    // Validate input
    if (value === "") return; // Allow empty for typing

    const numValue = Number.parseInt(value, 10);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      if (component === "r") setRError("Must be a number");
      if (component === "g") setGError("Must be a number");
      if (component === "b") setBError("Must be a number");
      return;
    }

    // Check if it's in range
    if (numValue < 0 || numValue > 255) {
      if (component === "r") setRError("Must be 0-255");
      if (component === "g") setGError("Must be 0-255");
      if (component === "b") setBError("Must be 0-255");
      return;
    }
  };

  // Handle RGB input blur - fix any invalid values
  const handleRgbBlur = (component: "r" | "g" | "b") => {
    let value: string;
    if (component === "r") value = rValue;
    else if (component === "g") value = gValue;
    else value = bValue;

    // Handle empty input
    if (value === "") {
      if (component === "r") {
        setRValue(rgb.r.toString());
        setRError("");
      }
      if (component === "g") {
        setGValue(rgb.g.toString());
        setGError("");
      }
      if (component === "b") {
        setBValue(rgb.b.toString());
        setBError("");
      }
      return;
    }

    const numValue = Number.parseInt(value, 10);

    // If invalid, reset to current RGB value
    if (isNaN(numValue) || numValue < 0 || numValue > 255) {
      if (component === "r") {
        setRValue(rgb.r.toString());
        setRError("");
      }
      if (component === "g") {
        setGValue(rgb.g.toString());
        setGError("");
      }
      if (component === "b") {
        setBValue(rgb.b.toString());
        setBError("");
      }
    } else {
      // If valid but different format (e.g., "05" instead of "5"), normalize
      if (component === "r") {
        setRValue(numValue.toString());
        setRError("");
      }
      if (component === "g") {
        setGValue(numValue.toString());
        setGError("");
      }
      if (component === "b") {
        setBValue(numValue.toString());
        setBError("");
      }

      // Only update the color if all values are valid numbers
      const r = component === "r" ? numValue : Number.parseInt(rValue, 10) || 0;
      const g = component === "g" ? numValue : Number.parseInt(gValue, 10) || 0;
      const b = component === "b" ? numValue : Number.parseInt(bValue, 10) || 0;

      // Only update if all values are valid
      if (
        !isNaN(r) &&
        !isNaN(g) &&
        !isNaN(b) &&
        r >= 0 &&
        r <= 255 &&
        g >= 0 &&
        g <= 255 &&
        b >= 0 &&
        b <= 255
      ) {
        setColorFromRgb(r, g, b);
      }
    }
  };

  // Add a key handler to apply RGB values on Enter key
  const handleRgbKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    component: "r" | "g" | "b"
  ) => {
    if (e.key === "Enter") {
      handleRgbBlur(component);
    }
  };

  // Handle HSL input changes
  const handleHslChange = (component: "h" | "s" | "l", value: string) => {
    // Update the local state
    if (component === "h") {
      setHValue(value);
      setHError("");
    }
    if (component === "s") {
      setSValue(value);
      setSError("");
    }
    if (component === "l") {
      setLValue(value);
      setLError("");
    }

    // Allow empty for typing
    if (value === "") return;

    const numValue = Number.parseInt(value, 10);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      if (component === "h") setHError("Must be a number");
      if (component === "s") setSError("Must be a number");
      if (component === "l") setLError("Must be a number");
      return;
    }

    // Check if it's in range
    if (component === "h" && (numValue < 0 || numValue > 359)) {
      setHError("Must be 0-359");
      return;
    }
    if (
      (component === "s" || component === "l") &&
      (numValue < 0 || numValue > 100)
    ) {
      if (component === "s") setSError("Must be 0-100");
      if (component === "l") setLError("Must be 0-100");
      return;
    }
  };

  // Handle HSL input blur - fix any invalid values
  const handleHslBlur = (component: "h" | "s" | "l") => {
    let value: string;
    if (component === "h") value = hValue;
    else if (component === "s") value = sValue;
    else value = lValue;

    // Handle empty input
    if (value === "") {
      if (component === "h") {
        setHValue(hue.toString());
        setHError("");
      }
      if (component === "s") {
        setSValue(saturation.toString());
        setSError("");
      }
      if (component === "l") {
        setLValue(lightness.toString());
        setLError("");
      }
      return;
    }

    const numValue = Number.parseInt(value, 10);

    // If invalid, reset to current HSL value
    if (
      isNaN(numValue) ||
      (component === "h" && (numValue < 0 || numValue > 359)) ||
      ((component === "s" || component === "l") &&
        (numValue < 0 || numValue > 100))
    ) {
      if (component === "h") {
        setHValue(hue.toString());
        setHError("");
      }
      if (component === "s") {
        setSValue(saturation.toString());
        setSError("");
      }
      if (component === "l") {
        setLValue(lightness.toString());
        setLError("");
      }
    } else {
      // If valid but different format, normalize
      if (component === "h") {
        setHValue(numValue.toString());
        setHError("");
      }
      if (component === "s") {
        setSValue(numValue.toString());
        setSError("");
      }
      if (component === "l") {
        setLValue(numValue.toString());
        setLError("");
      }

      // Only update the color if all values are valid
      const h = component === "h" ? numValue : Number.parseInt(hValue, 10) || 0;
      const s = component === "s" ? numValue : Number.parseInt(sValue, 10) || 0;
      const l = component === "l" ? numValue : Number.parseInt(lValue, 10) || 0;

      // Only update if all values are valid
      if (
        !isNaN(h) &&
        !isNaN(s) &&
        !isNaN(l) &&
        h >= 0 &&
        h <= 359 &&
        s >= 0 &&
        s <= 100 &&
        l >= 0 &&
        l <= 100
      ) {
        setColorFromHsl(h, s, l);
      }
    }
  };

  // Add a key handler to apply HSL values on Enter key
  const handleHslKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    component: "h" | "s" | "l"
  ) => {
    if (e.key === "Enter") {
      handleHslBlur(component);
    }
  };

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {/* RGB Inputs */}
        <div>
          <Label htmlFor="rgb-r" className="text-xs font-medium mb-1 block">
            R (0-255)
          </Label>
          <Input
            id="rgb-r"
            type="text"
            inputMode="numeric"
            value={rValue}
            onChange={(e) => handleRgbChange("r", e.target.value)}
            onBlur={() => handleRgbBlur("r")}
            onKeyDown={(e) => handleRgbKeyDown(e, "r")}
            className={`font-mono text-sm h-8 ${
              rError ? "border-destructive" : ""
            }`}
            aria-invalid={!!rError}
            aria-describedby={rError ? "r-error" : undefined}
            min="0"
            max="255"
          />
          {renderErrorMessage(rError)}
        </div>
        <div>
          <Label htmlFor="rgb-g" className="text-xs font-medium mb-1 block">
            G (0-255)
          </Label>
          <Input
            id="rgb-g"
            type="text"
            inputMode="numeric"
            value={gValue}
            onChange={(e) => handleRgbChange("g", e.target.value)}
            onBlur={() => handleRgbBlur("g")}
            onKeyDown={(e) => handleRgbKeyDown(e, "g")}
            className={`font-mono text-sm h-8 ${
              gError ? "border-destructive" : ""
            }`}
            aria-invalid={!!gError}
            aria-describedby={gError ? "g-error" : undefined}
            min="0"
            max="255"
          />
          {renderErrorMessage(gError)}
        </div>
        <div>
          <Label htmlFor="rgb-b" className="text-xs font-medium mb-1 block">
            B (0-255)
          </Label>
          <Input
            id="rgb-b"
            type="text"
            inputMode="numeric"
            value={bValue}
            onChange={(e) => handleRgbChange("b", e.target.value)}
            onBlur={() => handleRgbBlur("b")}
            onKeyDown={(e) => handleRgbKeyDown(e, "b")}
            className={`font-mono text-sm h-8 ${
              bError ? "border-destructive" : ""
            }`}
            aria-invalid={!!bError}
            aria-describedby={bError ? "b-error" : undefined}
            min="0"
            max="255"
          />
          {renderErrorMessage(bError)}
        </div>

        {/* HSL Inputs */}
        <div>
          <Label htmlFor="hsl-h" className="text-xs font-medium mb-1 block">
            H (0-359)
          </Label>
          <Input
            id="hsl-h"
            type="text"
            inputMode="numeric"
            value={hValue}
            onChange={(e) => handleHslChange("h", e.target.value)}
            onBlur={() => handleHslBlur("h")}
            onKeyDown={(e) => handleHslKeyDown(e, "h")}
            className={`font-mono text-sm h-8 ${
              hError ? "border-destructive" : ""
            }`}
            aria-invalid={!!hError}
            aria-describedby={hError ? "h-error" : undefined}
            min="0"
            max="359"
          />
          {renderErrorMessage(hError)}
        </div>
        <div>
          <Label htmlFor="hsl-s" className="text-xs font-medium mb-1 block">
            S (0-100)
          </Label>
          <Input
            id="hsl-s"
            type="text"
            inputMode="numeric"
            value={sValue}
            onChange={(e) => handleHslChange("s", e.target.value)}
            onBlur={() => handleHslBlur("s")}
            onKeyDown={(e) => handleHslKeyDown(e, "s")}
            className={`font-mono text-sm h-8 ${
              sError ? "border-destructive" : ""
            }`}
            aria-invalid={!!sError}
            aria-describedby={sError ? "s-error" : undefined}
            min="0"
            max="100"
          />
          {renderErrorMessage(sError)}
        </div>
        <div>
          <Label htmlFor="hsl-l" className="text-xs font-medium mb-1 block">
            L (0-100)
          </Label>
          <Input
            id="hsl-l"
            type="text"
            inputMode="numeric"
            value={lValue}
            onChange={(e) => handleHslChange("l", e.target.value)}
            onBlur={() => handleHslBlur("l")}
            onKeyDown={(e) => handleHslKeyDown(e, "l")}
            className={`font-mono text-sm h-8 ${
              lError ? "border-destructive" : ""
            }`}
            aria-invalid={!!lError}
            aria-describedby={lError ? "l-error" : undefined}
            min="0"
            max="100"
          />
          {renderErrorMessage(lError)}
        </div>
      </div>

      {/* Lightness and Alpha sliders */}
      <div className="w-full space-y-4 mt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Lightness: {localLightness}%</Label>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[localLightness]}
            onValueChange={handleLightnessChange}
          />
        </div>
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <Label>Alpha: {localAlpha.toFixed(2)}</Label>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[localAlpha]}
            onValueChange={handleAlphaChange}
            style={
              {
                "--slider-track-background": `linear-gradient(to right, 
                rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), 
                rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1))`,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </>
  );
}
