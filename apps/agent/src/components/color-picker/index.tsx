import { Card } from "@/components/ui/card";
import { ColorDetails } from "./color-details";
import { ColorSliders } from "./color-sliders";
import { ColorWheel } from "./color-wheel";

export default function ColorPicker() {
  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Color Wheel */}
        <div className="lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-[280px]">
            <ColorWheel />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:w-1/2 flex flex-col gap-4 justify-center">
          <ColorDetails />
          <ColorSliders />
        </div>
      </div>
    </Card>
  );
}
