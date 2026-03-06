"use client";

import { useMemo, useDeferredValue } from "react";
import { useColorStore } from "@/provider";
import {
  calculateComplementary,
  calculateAnalogous,
  calculateTriadic,
  calculateTetradic,
} from "@mirrorlake/color-tools";
import { ColorStrip } from "./color-strip";

export function HarmonyTab() {
  const currentColor = useColorStore((state) => state.currentColor);

  const deferredColor = useDeferredValue(currentColor);

  const harmonies = useMemo(
    () => ({
      complementary: calculateComplementary(deferredColor),
      analogous: calculateAnalogous(deferredColor),
      triadic: calculateTriadic(deferredColor),
      tetradic: calculateTetradic(deferredColor),
    }),
    [deferredColor]
  );

  return (
    <div className="space-y-4">
      <ColorStrip
        colors={[deferredColor, harmonies.complementary]}
        label="Complementary"
      />
      <ColorStrip
        colors={[harmonies.analogous[0], deferredColor, harmonies.analogous[1]]}
        label="Analogous"
      />
      <ColorStrip
        colors={[deferredColor, ...harmonies.triadic]}
        label="Triadic"
      />
      <ColorStrip
        colors={[deferredColor, ...harmonies.tetradic]}
        label="Tetradic"
      />
    </div>
  );
}
