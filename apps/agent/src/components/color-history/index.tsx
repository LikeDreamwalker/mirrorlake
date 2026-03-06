import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CurrentTheme from "./color-theme";
import ColorPalettes from "./color-palettes";
import { RecentColors } from "./recent-colors";

export default function ColorHistory() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <RecentColors />

        <Separator />

        <Suspense fallback={<div className="h-12 animate-pulse rounded-md bg-muted" />}>
          <CurrentTheme />
        </Suspense>

        <Separator />

        <Suspense fallback={<div className="h-8 animate-pulse rounded-md bg-muted" />}>
          <ColorPalettes />
        </Suspense>
      </div>
    </Card>
  );
}
