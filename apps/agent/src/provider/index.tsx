"use client";

import type React from "react";
import { createContext, useContext, useRef, useEffect } from "react";
import { useStore } from "zustand";
import { createColorStore, type ColorStore } from "@/store";
import { useTheme } from "next-themes";
import { isColorDark } from "@mirrorlake/color-tools";
import { createColorItem } from "@/store";
import { useShallow } from "zustand/react/shallow";
export const ColorStoreContext = createContext<ReturnType<
  typeof createColorStore
> | null>(null);

interface ColorStoreProviderProps {
  children: React.ReactNode;
  initialColor?: string;
}

export function ColorStoreProvider({
  children,
  initialColor,
}: ColorStoreProviderProps) {
  const storeRef = useRef<ReturnType<typeof createColorStore> | null>(null);

  if (!storeRef.current) {
    console.log(initialColor, "?>?>?>1234");
    storeRef.current = createColorStore(initialColor);
  }

  return (
    <ColorStoreContext.Provider value={storeRef.current}>
      <ColorProviderInner initialColor={initialColor}>
        {children}
      </ColorProviderInner>
    </ColorStoreContext.Provider>
  );
}

function ColorProviderInner({
  children,
  initialColor,
}: ColorStoreProviderProps) {
  const store = useContext(ColorStoreContext);
  if (!store) throw new Error("ColorStoreProvider not found");

  // Theme switcher hook
  useColorThemeSwitcher();

  const setColorFromHex = useStore(store, (s) => s.setColorFromHex);

  useEffect(() => {
    function handleVSCodeMessage(event: MessageEvent) {
      const data = event.data;
      if (data && typeof data === "object" && typeof data.color === "string") {
        if (data.type === "init") {
          const theme = typeof data.theme === "string" ? data.theme : undefined;
          const mainItem = createColorItem(data.color, data.color, "");

          if (store) {
            store.setState({
              currentColorInfo: mainItem,
              currentColor: data.color.toUpperCase(),
              colors: [mainItem],
              recentColors: [data.color.toUpperCase()],
              isDark: theme ? theme === "dark" : isColorDark(data.color),
            });
          }
        } else if (data.type === "update") {
          setColorFromHex(data.color);
        }
      }
    }

    window.addEventListener("message", handleVSCodeMessage);
    return () => window.removeEventListener("message", handleVSCodeMessage);
  }, [setColorFromHex, store]);

  return <>{children}</>;
}

function useColorThemeSwitcher() {
  const store = useContext(ColorStoreContext);
  if (!store) throw new Error("ColorStoreProvider not found");

  const { setTheme } = useTheme();
  const isDark = useStore(store, (s) => s.isDark);
  const autoSwitchTheme = useStore(store, (s) => s.autoSwitchTheme);

  useEffect(() => {
    if (autoSwitchTheme) {
      setTheme(isDark ? "dark" : "light");
    }
  }, [isDark, autoSwitchTheme, setTheme]);

  return null;
}

// Export the hook for direct usage with SSR safety
export function useColorStoreOriginal<T>(
  selector: (store: ColorStore) => T
): T {
  const store = useContext(ColorStoreContext);
  if (!store)
    throw new Error("useColorStore must be used within ColorStoreProvider");

  const state = store.getState();

  // For SSR safety, we can use a client-side check
  if (typeof window === "undefined") {
    // Return a default value during SSR - you might need to adjust this based on your selector
    return selector(state);
  }

  return useStore(store, selector);
}

// For when you need multiple values, use useShallow
export function useColorStore<T>(selector: (state: ColorStore) => T) {
  return useColorStoreOriginal(useShallow(selector));
}
