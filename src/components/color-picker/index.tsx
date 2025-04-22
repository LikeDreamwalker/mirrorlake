import { Card } from "@/components/ui/card";
import { ColorDetails } from "./color-details";
import { ColorSliders } from "./color-sliders";
import { ColorWheel } from "./color-wheel";
import { ColorPickerProvider } from "./context";

export default function ColorPicker() {
  return (
    <ColorPickerProvider>
      <div className="w-full flex flex-col gap-4">
        {/* Color wheel - now self-contained */}
        <ColorWheel />

        {/* Color Details Card */}
        <Card className="p-4">
          <ColorDetails />
          <ColorSliders />
        </Card>
      </div>
    </ColorPickerProvider>
  );
}
