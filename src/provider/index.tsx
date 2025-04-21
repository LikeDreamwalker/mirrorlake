"use client";

import type React from "react";
import { useStore, useColorThemeSwitcher } from "@/store";

interface ColorProviderProps {
  children: React.ReactNode;
  initialColor?: string;
}

export function ColorProvider({
  children,
  initialColor = "#0066FF",
}: ColorProviderProps) {
  // Initialize the theme switcher
  useColorThemeSwitcher(initialColor);

  // Get the current color directly from the store
  const { currentColor } = useStore();

  // Return the wrapper div with the background color
  return (
    <div
      className="size-full"
      style={{
        backgroundColor: currentColor,
        transitionBehavior: "background-color",
        transitionDuration: "0.3s",
        transitionProperty: "background-color",
        willChange: "background-color",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
