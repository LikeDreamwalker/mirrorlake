"use client";

import { useMemo, useDeferredValue } from "react";
import { useColorStore } from "@/provider";
import { getColorTints, getColorShades } from "@mirrorlake/color-tools";
import { DetailItem } from "@/components/color-picker/detail-item";
import { ColorStrip } from "./color-strip";
import { toast } from "sonner";

export function InfoTab() {
  const { currentColorInfo, currentColor } = useColorStore((state) => ({
    currentColorInfo: state.currentColorInfo,
    currentColor: state.currentColor,
  }));

  const { rgb, hsl, alpha } = currentColorInfo;

  const deferredColor = useDeferredValue(currentColor);
  const tints = useMemo(() => getColorTints(deferredColor, 5), [deferredColor]);
  const shades = useMemo(() => getColorShades(deferredColor, 5), [deferredColor]);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast("Copied!", { description: value });
  };

  return (
    <div className="space-y-4">
      {/* Color values */}
      <div className="grid grid-cols-2 gap-2">
        <DetailItem
          label="HEX"
          value={currentColor.toUpperCase()}
          onClick={() => copyToClipboard(currentColor.toUpperCase())}
        />
        <DetailItem
          label="RGB"
          value={`${rgb.r}, ${rgb.g}, ${rgb.b}`}
          onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
        />
        <DetailItem
          label="HSL"
          value={`${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`}
          onClick={() =>
            copyToClipboard(
              `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
            )
          }
        />
        <DetailItem
          label="RGBA"
          value={`${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)}`}
          onClick={() =>
            copyToClipboard(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`)
          }
        />
      </div>

      {/* Tints & Shades */}
      <ColorStrip colors={tints} label="Tints" />
      <ColorStrip colors={shades} label="Shades" />
    </div>
  );
}
