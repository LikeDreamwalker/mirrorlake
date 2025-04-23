import { Card } from "@/components/ui/card";
import { ColorDetails } from "./color-details";
import { ColorSliders } from "./color-sliders";
import { ColorWheel } from "./color-wheel";
import { ColorPickerProvider } from "./context";
import Contact from "@/components/contact";

export default function ColorPicker() {
  return (
    <ColorPickerProvider>
      <div className="w-full flex flex-col gap-4">
        {/* Color wheel */}
        <ColorWheel />

        {/* Color Details Card */}
        <Card className="p-4 flex gap-4 flex-col">
          <ColorDetails />
          <ColorSliders />
          <Contact />
        </Card>
      </div>
    </ColorPickerProvider>
  );
}
