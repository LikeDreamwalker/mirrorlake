"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ColorFormat = "hex" | "rgb" | "hsl";

// Convert HSL to RGB
const hslToRgb = (
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

// Convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
};

// Convert HSL to Hex
const hslToHex = (h: number, s: number, l: number): string => {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

// Convert alpha to hex
const alphaToHex = (alpha: number): string => {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
};

// Update the hexToRgb function to handle alpha in hex colors
const hexToRgb = (
  hex: string
): { r: number; g: number; b: number; a?: number } => {
  // Remove the # if present
  hex = hex.replace(/^#/, "");

  // Parse the hex values
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  // Check if we have an alpha channel
  let a: number | undefined = undefined;
  if (hex.length >= 8) {
    a = Number.parseInt(hex.slice(6, 8), 16) / 255;
  }

  return { r, g, b, a };
};

// Convert RGB to HSL
const rgbToHsl = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

// Update the hexToHsl function to handle alpha
const hexToHsl = (
  hex: string
): { h: number; s: number; l: number; a?: number } => {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { ...hsl, a: rgb.a };
};

// Get contrasting text color
const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

export default function ColorPicker() {
  const [baseColor, setBaseColor] = useState("#6366F1"); // 6-digit hex without alpha
  const [hue, setHue] = useState(240);
  const [saturation, setSaturation] = useState(89);
  const [lightness, setLightness] = useState(67);
  const [alpha, setAlpha] = useState(1);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [isDragging, setIsDragging] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const wheelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  // const { toast } = useToast();

  // RGB values derived from HSL
  const rgb = hslToRgb(hue, saturation, lightness);

  // Update base color when HSL changes
  useEffect(() => {
    const color = hslToHex(hue, saturation, lightness);
    setBaseColor(color);
  }, [hue, saturation, lightness]);

  // Get the full color with alpha
  const getFullColor = useCallback(() => {
    if (alpha < 1) {
      return `${baseColor}${alphaToHex(alpha)}`;
    }
    return baseColor;
  }, [baseColor, alpha]);

  // Add to recent colors when color changes
  useEffect(() => {
    const fullColor = getFullColor();
    if (!recentColors.includes(fullColor)) {
      setRecentColors((prev) => [fullColor, ...prev.slice(0, 7)]);
    }
  }, [baseColor, alpha, getFullColor, recentColors]);

  // Handle color wheel interaction with performance optimization
  const handleWheelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateWheelPosition(e);
  };

  const updateWheelPosition = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!wheelRef.current) return;

      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smoother updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = wheelRef.current!.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate position relative to center
        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;

        // Calculate angle (hue) and distance from center (saturation)
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const radius = rect.width / 2;
        const distance = Math.min(Math.sqrt(x * x + y * y), radius);
        const newSaturation = Math.round((distance / radius) * 100);

        setHue(Math.round(angle));
        setSaturation(newSaturation);
      });
    },
    []
  );

  // Handle mouse move and up events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateWheelPosition(e as any);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, updateWheelPosition]);

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();

    // Basic validation for hex format
    if (/^#[0-9A-F]{0,8}$/i.test(value)) {
      // If we have at least a 6-digit hex
      if (value.length >= 7) {
        const baseHex = value.substring(0, 7);
        setBaseColor(baseHex);

        const hsl = hexToHsl(baseHex);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);

        // If we have alpha in the hex
        if (value.length === 9) {
          const alphaHex = value.substring(7, 9);
          const alphaValue = Number.parseInt(alphaHex, 16) / 255;
          setAlpha(alphaValue);
        } else {
          setAlpha(1); // Reset alpha if no alpha in hex
        }
      } else {
        // Handle partial input
        setBaseColor(value);
      }
    }
  };

  // Handle RGB input changes
  const handleRgbChange = (component: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgb, [component]: value };
    const hsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  };

  // Handle HSL input changes
  const handleHslChange = (component: "h" | "s" | "l", value: number) => {
    if (component === "h") setHue(value);
    if (component === "s") setSaturation(value);
    if (component === "l") setLightness(value);
  };

  // Copy color to clipboard
  const copyToClipboard = () => {
    const colorString = getColorString();
    navigator.clipboard.writeText(colorString);
    // toast({
    //   title: "Copied!",
    //   description: `${colorString} has been copied to clipboard`,
    //   duration: 2000,
    // });
  };

  // Generate a random color
  const generateRandomColor = () => {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 100);
    const l = Math.floor(Math.random() * 100);

    setHue(h);
    setSaturation(s);
    setLightness(l);
  };

  // Get color string based on format
  const getColorString = (): string => {
    switch (format) {
      case "hex":
        return getFullColor();
      case "rgb":
        return alpha < 1
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case "hsl":
        return alpha < 1
          ? `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
          : `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      default:
        return getFullColor();
    }
  };

  // Get background color with alpha support
  const getBackgroundColor = (): string => {
    if (alpha < 1) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    return baseColor;
  };

  // Render lightness slider
  const renderLightnessSlider = () => (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between">
        <Label>Lightness: {lightness}%</Label>
      </div>
      <div className="relative">
        <div
          className="absolute inset-0 rounded-md -z-10"
          style={{
            background: `linear-gradient(to right, 
              hsl(${hue}, ${saturation}%, 0%), 
              hsl(${hue}, ${saturation}%, 50%), 
              hsl(${hue}, ${saturation}%, 100%))`,
          }}
        ></div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[lightness]}
          onValueChange={(value) => setLightness(value[0])}
          className="z-10"
        />
      </div>
    </div>
  );

  // Render alpha slider
  const renderAlphaSlider = () => (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between">
        <Label>Alpha: {alpha.toFixed(2)}</Label>
      </div>
      <div className="relative">
        <div
          className="absolute inset-0 rounded-md -z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)),
              url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")
            `,
            backgroundPosition: "left center",
          }}
        ></div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[alpha]}
          onValueChange={(value) => setAlpha(value[0])}
          className="z-10"
        />
      </div>
    </div>
  );

  return (
    <div
      className="w-full p-6 space-y-6 rounded-xl shadow-lg"
      style={{
        backgroundColor: getBackgroundColor(),
        backgroundImage:
          alpha < 1
            ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")'
            : undefined,
        backgroundPosition: "left center",
      }}
    >
      {/* Color Display */}
      <div
        className="h-24 rounded-lg shadow-md flex items-center justify-center transition-colors duration-300 relative overflow-hidden bg-white bg-opacity-10 backdrop-blur-sm"
        style={{
          color: getContrastColor(baseColor),
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-center z-10">
          <div className="font-mono text-xl mb-2">{getColorString()}</div>
          <div className="text-sm opacity-80">
            HSL: {hue}°, {saturation}%, {lightness}%
            {alpha < 1 ? `, ${alpha.toFixed(2)}` : ""}
          </div>
        </div>
      </div>

      {/* Color Wheel */}
      <div className="rounded-xl shadow-lg p-4 bg-white">
        <div
          ref={wheelRef}
          className="relative w-full aspect-square rounded-full overflow-hidden cursor-crosshair shadow-inner mx-auto"
          style={{
            background: `conic-gradient(
              from 0deg,
              hsl(0, 100%, 50%),
              hsl(60, 100%, 50%),
              hsl(120, 100%, 50%),
              hsl(180, 100%, 50%),
              hsl(240, 100%, 50%),
              hsl(300, 100%, 50%),
              hsl(360, 100%, 50%)
            )`,
            maxWidth: "280px",
          }}
          onMouseDown={handleWheelMouseDown}
        >
          {/* White radial gradient for saturation */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
            }}
          ></div>

          {/* Selection marker */}
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${
                50 + Math.cos((hue * Math.PI) / 180) * (saturation / 100) * 50
              }%`,
              top: `${
                50 + Math.sin((hue * Math.PI) / 180) * (saturation / 100) * 50
              }%`,
              backgroundColor: baseColor,
            }}
          ></div>
        </div>
      </div>

      {/* Color Format Tabs */}
      <div className="rounded-xl shadow-lg p-4 bg-white">
        <Tabs
          value={format}
          onValueChange={(value) => setFormat(value as ColorFormat)}
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="hex">HEX</TabsTrigger>
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="hsl">HSL</TabsTrigger>
          </TabsList>

          {/* HEX Format */}
          <TabsContent value="hex" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={getFullColor()}
                onChange={handleHexChange}
                className="font-mono uppercase"
                maxLength={9}
                aria-label="Hex color value"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                aria-label="Copy hex value"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Lightness and Alpha sliders */}
            {renderLightnessSlider()}
            {renderAlphaSlider()}
          </TabsContent>

          {/* RGB Format */}
          <TabsContent value="rgb" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="rgb-r">R</Label>
                <Input
                  id="rgb-r"
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange("r", Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="rgb-g">G</Label>
                <Input
                  id="rgb-g"
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange("g", Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="rgb-b">B</Label>
                <Input
                  id="rgb-b"
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange("b", Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={getColorString()}
                readOnly
                className="font-mono"
                aria-label="RGB color value"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                aria-label="Copy RGB value"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Lightness and Alpha sliders */}
            {renderLightnessSlider()}
            {renderAlphaSlider()}
          </TabsContent>

          {/* HSL Format */}
          <TabsContent value="hsl" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="hsl-h">H</Label>
                <Input
                  id="hsl-h"
                  type="number"
                  min="0"
                  max="359"
                  value={hue}
                  onChange={(e) => handleHslChange("h", Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="hsl-s">S</Label>
                <Input
                  id="hsl-s"
                  type="number"
                  min="0"
                  max="100"
                  value={saturation}
                  onChange={(e) => handleHslChange("s", Number(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="hsl-l">L</Label>
                <Input
                  id="hsl-l"
                  type="number"
                  min="0"
                  max="100"
                  value={lightness}
                  onChange={(e) => handleHslChange("l", Number(e.target.value))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                value={getColorString()}
                readOnly
                className="font-mono"
                aria-label="HSL color value"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                aria-label="Copy HSL value"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Lightness and Alpha sliders */}
            {renderLightnessSlider()}
            {renderAlphaSlider()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={generateRandomColor}
          className="bg-white bg-opacity-90"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Random
        </Button>
        <Button onClick={copyToClipboard} className="bg-white bg-opacity-90">
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="space-y-2 rounded-xl shadow-lg p-4 bg-white">
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground">
              Recent Colors
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentColors.slice(0, 8).map((color, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="w-8 h-8 rounded-md border shadow-sm transition-transform hover:scale-110"
                      style={{
                        backgroundColor:
                          color.length > 7
                            ? `rgba(${hexToRgb(color.substring(0, 7)).r}, ${
                                hexToRgb(color.substring(0, 7)).g
                              }, ${hexToRgb(color.substring(0, 7)).b}, ${
                                Number.parseInt(color.substring(7, 9), 16) / 255
                              })`
                            : color,
                      }}
                      onClick={() => {
                        if (color.length > 7) {
                          setBaseColor(color.substring(0, 7));
                          setAlpha(
                            Number.parseInt(color.substring(7, 9), 16) / 255
                          );
                        } else {
                          setBaseColor(color);
                          setAlpha(1);
                        }

                        const hsl = hexToHsl(color.substring(0, 7));
                        setHue(hsl.h);
                        setSaturation(hsl.s);
                        setLightness(hsl.l);
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{color}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
