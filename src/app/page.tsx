import ColorPicker from "@/components/color-picker";
import NavigationControls from "@/components/navigation";
import CardContainer from "@/components/card-container";
import ColorHistory from "@/components/color-history";
import ColorAssistant from "@/components/color-assistant";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col py-4 max-w-screen-2xl">
      {/* Main content area with CSS-based scrolling */}
      <div
        id="scroll-container"
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth h-full px-3 md:px-4"
      >
        <div className="flex w-full h-full gap-3 md:gap-4 lg:gap-6">
          <CardContainer id="color-picker">
            <ColorPicker />
          </CardContainer>

          <CardContainer id="color-history">
            <ColorHistory />
          </CardContainer>

          <CardContainer id="color-assistant" needScroll={false}>
            <ColorAssistant />
          </CardContainer>
        </div>
      </div>

      {/* Bottom navigation - client component for interactivity */}
      <NavigationControls />
    </div>
  );
}
