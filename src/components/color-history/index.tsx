import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import CurrentTheme from "./color-theme";
import ColorPalettes from "./color-palettes";

export default function ColorHistory() {
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6">
        <Suspense fallback={<Card className="h-24 animate-pulse" />}>
          <CurrentTheme />
        </Suspense>

        <Suspense fallback={<Card className="h-[30%] animate-pulse" />}>
          <ColorPalettes />
        </Suspense>
      </div>
    </div>
  );
}
