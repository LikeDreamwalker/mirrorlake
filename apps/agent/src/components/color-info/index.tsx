"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTab } from "./info-tab";
import { HarmonyTab } from "./harmony-tab";
import { AccessibilityTab } from "./accessibility-tab";
import { Info, Palette, Eye } from "lucide-react";

export function ColorInfo() {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="info" className="text-xs gap-1">
          <Info className="h-3 w-3" />
          Info
        </TabsTrigger>
        <TabsTrigger value="harmony" className="text-xs gap-1">
          <Palette className="h-3 w-3" />
          Harmony
        </TabsTrigger>
        <TabsTrigger value="accessibility" className="text-xs gap-1">
          <Eye className="h-3 w-3" />
          A11y
        </TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="mt-3">
        <InfoTab />
      </TabsContent>
      <TabsContent value="harmony" className="mt-3">
        <HarmonyTab />
      </TabsContent>
      <TabsContent value="accessibility" className="mt-3">
        <AccessibilityTab />
      </TabsContent>
    </Tabs>
  );
}
