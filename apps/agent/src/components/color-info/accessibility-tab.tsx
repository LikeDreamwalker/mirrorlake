"use client";

import { useMemo, useDeferredValue } from "react";
import { useColorStore } from "@/provider";
import { getContrastRatio, simulateColorBlindness } from "@mirrorlake/color-tools";
import { Badge } from "@/components/ui/badge";

function getWcagLevel(ratio: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (ratio >= 7) return { label: "AAA", variant: "default" };
  if (ratio >= 4.5) return { label: "AA", variant: "default" };
  if (ratio >= 3) return { label: "AA Large", variant: "secondary" };
  return { label: "Fail", variant: "destructive" };
}

function ContrastDisplay({ background, label, currentColor }: { background: string; label: string; currentColor: string }) {
  const ratio = getContrastRatio(currentColor, background);
  const wcag = getWcagLevel(ratio);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-md border border-border" style={{ backgroundColor: background, transition: "background-color 0.2s ease" }}>
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: currentColor, transition: "color 0.2s ease" }}
          >
            Aa
          </div>
        </div>
        <div>
          <div className="text-sm font-medium">vs {label}</div>
          <div className="text-xs text-muted-foreground font-mono">{ratio.toFixed(2)}:1</div>
        </div>
      </div>
      <Badge variant={wcag.variant}>{wcag.label}</Badge>
    </div>
  );
}

export function AccessibilityTab() {
  const currentColor = useColorStore((state) => state.currentColor);
  const deferredColor = useDeferredValue(currentColor);

  const simulation = useMemo(() => simulateColorBlindness(deferredColor), [deferredColor]);

  const simTypes = [
    { key: "protanopia" as const, label: "Protanopia", desc: "Red-blind" },
    { key: "deuteranopia" as const, label: "Deuteranopia", desc: "Green-blind" },
    { key: "tritanopia" as const, label: "Tritanopia", desc: "Blue-blind" },
  ];

  return (
    <div className="space-y-4">
      {/* Contrast ratios */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Contrast Ratio</div>
        <ContrastDisplay background="#FFFFFF" label="White" currentColor={deferredColor} />
        <ContrastDisplay background="#000000" label="Black" currentColor={deferredColor} />
      </div>

      {/* Color blindness simulation */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Color Blindness Simulation</div>
        <div className="grid grid-cols-3 gap-2">
          {simTypes.map(({ key, label, desc }) => (
            <div key={key} className="text-center space-y-1.5">
              <div className="flex gap-1 justify-center">
                <div
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ transition: "background-color 0.2s ease", backgroundColor: currentColor }}
                  title="Original"
                />
                <div
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ transition: "background-color 0.2s ease", backgroundColor: simulation[key] }}
                  title={label}
                />
              </div>
              <div className="text-xs font-medium">{label}</div>
              <div className="text-[10px] text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
