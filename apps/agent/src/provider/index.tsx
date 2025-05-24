"use client";

import type React from "react";
import { useColorThemeSwitcher } from "@/store";

interface ColorProviderProps {
  children: React.ReactNode;
}

export function ColorProvider({ children }: ColorProviderProps) {
  // Initialize the theme switcher
  useColorThemeSwitcher();

  // Return the wrapper div with the background color
  return <>{children}</>;
}
