"use client";

import { useColorStore } from "@/provider";
import { tailwindColors } from "@/lib/tailwind-colors";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ColorBlock from "./color-block";
import ColorGrid from "./color-grid";

export default function ColorPalettes() {
  const { setColorFromHex } = useColorStore((state) => ({
    setColorFromHex: state.setColorFromHex,
  }));

  const handleSelectColor = (hex: string) => {
    setColorFromHex(hex);
    toast("Color selected", {
      description: `${hex} is now the active color`,
      duration: 1500,
    });
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="tailwind" className="border-none">
        <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
          Tailwind Palettes
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-1">
            {Object.entries(tailwindColors).map(([key, colorFamily]) => (
              <div key={key}>
                <ColorGrid columns={11} gap="gap-1">
                  {colorFamily.colors.map((color) => (
                    <Tooltip key={`${key}-${color.value}`}>
                      <TooltipTrigger asChild>
                        <div className="w-full cursor-pointer">
                          <ColorBlock
                            color={color.hex}
                            onClick={() => handleSelectColor(color.hex)}
                            className="w-full"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">
                          {colorFamily.name}-{color.value}
                        </p>
                        <p className="text-xs font-mono">{color.hex.toUpperCase()}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </ColorGrid>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
