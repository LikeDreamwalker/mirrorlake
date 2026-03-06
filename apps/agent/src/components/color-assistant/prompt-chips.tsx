"use client";

import { Button } from "@/components/ui/button";
import { useChatContext } from "./context";
import { Palette, Sparkles, Accessibility, Lightbulb } from "lucide-react";

const suggestions = [
  { text: "Design a theme for a tech startup", icon: Palette },
  { text: "What emotions does this color evoke?", icon: Sparkles },
  { text: "Make my palette more accessible", icon: Accessibility },
  { text: "Suggest complementary colors for a landing page", icon: Lightbulb },
];

export function PromptChips() {
  const { sendMessage } = useChatContext();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
      <div className="text-center space-y-2">
        <h3 className="text-sm font-medium text-foreground">Color Agent</h3>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          Ask me about color theory, theme design, accessibility, or anything color-related.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[280px]">
        {suggestions.map(({ text, icon: Icon }) => (
          <Button
            key={text}
            variant="outline"
            size="sm"
            className="justify-start gap-2 text-xs h-auto py-2 px-3 text-left whitespace-normal"
            onClick={() => sendMessage(text)}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
