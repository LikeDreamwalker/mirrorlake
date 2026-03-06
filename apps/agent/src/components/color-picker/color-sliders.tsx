"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { debounce } from "@/lib/utils";
import { useColorStore } from "@/provider";

// Debounce timeout in milliseconds
const DEBOUNCE_TIMEOUT = 50;

export function ColorSliders() {
  const { localLightness, setLocalLightness, updateColorValues } = useColorStore((state) => ({
    localLightness: state.pickerLocalLightness,
    setLocalLightness: state.setPickerLocalLightness,
    updateColorValues: state.updateColorValues,
  }));

  // Create debounced update function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateColor = useCallback(
    debounce(
      (updates: { hue?: number; saturation?: number; lightness?: number; alpha?: number }) => {
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

  // Handle when user stops sliding the lightness slider
  const handleLightnessCommit = (value: number[]) => {
    // Update the store when user commits the value
    debouncedUpdateColor({ lightness: value[0] });
  };

  return (
    <div className="w-full space-y-4">
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
