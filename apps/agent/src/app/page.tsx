import ColorPicker from "@/components/color-picker";
import ColorHistory from "@/components/color-history";
import ColorAssistant from "@/components/color-assistant";
import { GradientBackground } from "@/components/gradient-background";
import StructuredData from "@/components/structured-data";
import InvisibleSEOHeading from "@/components/invisible-seo-heading";
import { ColorStoreProvider } from "@/provider";
import { MobileChatTrigger } from "@/components/layout/mobile-chat-trigger";
import { ColorInfo } from "@/components/color-info";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateThemePalette } from "@mirrorlake/color-tools";
import { colorsToNames } from "@/app/actions/color";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  let color = searchParams.color || "#0066ff";
  if (Array.isArray(color)) {
    color = color[0];
  }
  const paletteHex = generateThemePalette(color);
  const colorNames = await colorsToNames(paletteHex);
  const initialTheme = paletteHex.map((hex, i) => ({
    color: hex,
    name: colorNames[i] || `Color ${hex}`,
  }));

  return (
    <ColorStoreProvider initialColor={color} initialTheme={initialTheme}>
      <main className="flex h-screen w-full overflow-hidden max-w-screen-2xl mx-auto p-4 gap-4">
        <StructuredData />
        <InvisibleSEOHeading title="Mirrorlake - Color Agent" level={1} />
        <GradientBackground className="fixed inset-0 -z-10" />

        {/* Left card: Picker + Info + Palette (internal scroll) */}
        <Card className="flex-1 flex flex-col overflow-hidden lg:flex-[2]">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <ColorPicker />

              <Card className="p-4">
                <ColorInfo />
              </Card>

              <ColorHistory />
            </div>
          </ScrollArea>
        </Card>

        {/* Right card: Chat (fixed height, internal scroll) — desktop only */}
        <Card className="hidden lg:flex flex-1 flex-col overflow-hidden">
          <ColorAssistant />
        </Card>

        {/* Mobile: FAB + Sheet for chat */}
        <MobileChatTrigger>
          <ColorAssistant />
        </MobileChatTrigger>
      </main>
    </ColorStoreProvider>
  );
}
