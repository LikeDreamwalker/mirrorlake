import ColorPicker from "@/components/color-picker";
import NavigationControls from "@/components/navigation";
import CardContainer from "@/components/card-container";
import ColorHistory from "@/components/color-history";
import ColorAssistant from "@/components/color-assistant";
import { GradientBackground } from "@/components/gradient-background";
import StructuredData from "@/components/structured-data";
import InvisibleSEOHeading from "@/components/invisible-seo-heading";
import { ColorStoreProvider } from "@/provider";
import { generateThemePalette } from "@mirrorlake/color-tools";
import { colorsToNames } from "@/app/actions/color";
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  let color = searchParams.color || "#0066ff";
  if (Array.isArray(color)) {
    color = color[0];
  }
  console.log(color, "color");

  const paletteHex = generateThemePalette(color);
  console.log(paletteHex, "paletteHex");
  const colorNames = await colorsToNames(paletteHex);
  const initialTheme = paletteHex.map((hex, i) => ({
    color: hex,
    name: colorNames[i] || `Color ${hex}`,
  }));
  console.log(initialTheme, "initialTheme");

  return (
    <ColorStoreProvider initialColor={color} initialTheme={initialTheme}>
      <main className="flex flex-col h-full w-full overflow-hidden max-w-screen-2xl mx-auto p-2">
        <StructuredData />
        <InvisibleSEOHeading title="Mirrorlake - Color Agent" level={1} />
        <GradientBackground className="fixed inset-0 -z-10" />
        {/* Main content area with CSS-based scrolling */}
        <div
          id="scroll-container"
          className="flex-1 overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth"
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

        {/* Bottom navigation with static height */}
        <div className="h-16 pt-2 px-2 sm:hidden">
          <NavigationControls />
        </div>
      </main>
    </ColorStoreProvider>
  );
}
