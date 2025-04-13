import ColorPicker from "@/components/color-picker";
import NavigationControls from "@/components/navigation";
import CardContainer from "@/components/card-container";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col py-4">
      {/* Main content area with CSS-based scrolling */}
      <div
        id="scroll-container"
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth h-full p-0 lg:px-4"
      >
        <div className="flex w-full h-full gap-0 lg:gap-6">
          <CardContainer id="color-picker">
            <ColorPicker />
          </CardContainer>

          <CardContainer id="color-history">
            <p className="text-gray-400 text-lg">Color History Content</p>
          </CardContainer>

          <CardContainer id="color-assistant">
            <p className="text-gray-400 text-lg">Chat Assistant Content</p>
          </CardContainer>
        </div>
      </div>

      {/* Bottom navigation - client component for interactivity */}
      <NavigationControls />
    </div>
  );
}
