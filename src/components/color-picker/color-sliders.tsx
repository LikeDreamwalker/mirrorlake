"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
    storeValues,
  } = useColorPicker();

  // Track if user is currently sliding
  const [isSliding, setIsSliding] = useState(false);

  const { currentColorInfo, updateColorValues } = storeValues;

  // Memoize values from currentColorInfo to avoid unnecessary re-renders
  const rgb = useMemo(() => currentColorInfo.rgb, [currentColorInfo.rgb]);

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

  // Handle lightness slider change (during sliding)
  const handleLightnessChange = (value: number[]) => {
    // Only update local state for immediate visual feedback
    setLocalLightness(value[0]);
  };

  // Handle alpha slider change (during sliding)
  const handleAlphaChange = (value: number[]) => {
    // Only update local state for immediate visual feedback
    setLocalAlpha(value[0]);
  };

  // Handle when user stops sliding the lightness slider
  const handleLightnessCommit = (value: number[]) => {
    // Update the store when user commits the value
    debouncedUpdateColor({ lightness: value[0] });
  };

  // Handle when user stops sliding the alpha slider
  const handleAlphaCommit = (value: number[]) => {
    // Update the store when user commits the value
    debouncedUpdateColor({ alpha: value[0] });
  };

  // Handle when user starts sliding
  const handleSlideStart = () => {
    setIsSliding(true);
  };

  // Handle when user stops sliding
  const handleSlideEnd = () => {
    setIsSliding(false);
  };

  return (
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
          onValueCommit={handleLightnessCommit}
          onPointerDown={handleSlideStart}
          onPointerUp={handleSlideEnd}
        />
      </div>
      {/* NOTE We have issues in updating alpha */}
      {/* <div className="space-y-2 mt-3">
        <div className="flex justify-between items-center">
          <Label>Alpha: {localAlpha.toFixed(2)}</Label>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[localAlpha]}
          onValueChange={handleAlphaChange}
          onValueCommit={handleAlphaCommit}
          onPointerDown={handleSlideStart}
          onPointerUp={handleSlideEnd}
        />
      </div> */}
    </div>
  );
}
