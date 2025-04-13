"use client";

import type React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Copy, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useColorPicker, type ColorFormat } from "./context";

export default function ColorPicker() {
  const {
    baseColor,
    hue,
    saturation,
    lightness,
    alpha,
    rgb,
    format,
    recentColors,
    setHue,
    setSaturation,
    setLightness,
    setAlpha,
    setFormat,
    getFullColor,
    getColorString,
    getBackgroundColor,
    generateRandomColor,
    setColorFromHex,
    setColorFromRgb,
    hexToRgb,
  } = useColorPicker();

  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle color wheel interaction with performance optimization
  const handleWheelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateWheelPosition(e);
  };

  // Fixed function to correctly calculate and update the color wheel position
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
        // Math.atan2 returns the angle in radians, convert to degrees
        let angle = Math.atan2(y, x) * (180 / Math.PI);

        // Adjust angle to start from the top (0 degrees) and go clockwise
        angle = (angle + 90) % 360;
        if (angle < 0) angle += 360;

        const radius = rect.width / 2;
        const distance = Math.min(Math.sqrt(x * x + y * y), radius);
        const newSaturation = Math.round((distance / radius) * 100);

        setHue(Math.round(angle));
        setSaturation(newSaturation);
      });
    },
    [setHue, setSaturation]
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
    setColorFromHex(value);
  };

  // Handle RGB input changes
  const handleRgbChange = (component: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgb, [component]: value };
    setColorFromRgb(newRgb.r, newRgb.g, newRgb.b);
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
    toast("Copied!", {
      description: `${colorString} has been copied to clipboard`,
      duration: 2000,
    });
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

  // Calculate marker position correctly based on hue and saturation
  const getMarkerPosition = () => {
    // Convert hue to radians, adjusting to start from the top (270 degrees in standard position)
    const hueRadians = ((hue - 90) * Math.PI) / 180;

    // Calculate x and y coordinates based on saturation (distance from center)
    const saturationPercent = saturation / 100;

    // Calculate position
    const x = 50 + Math.cos(hueRadians) * saturationPercent * 50;
    const y = 50 + Math.sin(hueRadians) * saturationPercent * 50;

    return { x, y };
  };

  // Get marker position
  const markerPosition = getMarkerPosition();

  return (
    <div className="w-full space-y-6">
      {/* Color Display */}
      <Card
        className="border-dashed"
        style={{
          backgroundColor: getBackgroundColor(),
          backgroundImage:
            alpha < 1
              ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")'
              : undefined,
          backgroundPosition: "left center",
        }}
      >
        <CardContent>
          <div
            className="h-24 flex items-center justify-center transition-colors duration-300 relative bg-white bg-opacity-10 backdrop-blur-sm"
            style={{
              color:
                alpha < 1 ? "#000000" : lightness > 50 ? "#000000" : "#ffffff",
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
        </CardContent>
      </Card>

      {/* Color Wheel */}
      <Card className="border-dashed">
        <CardContent>
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

            {/* Selection marker - using the corrected position calculation */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${markerPosition.x}%`,
                top: `${markerPosition.y}%`,
                backgroundColor: baseColor,
              }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Color Format Tabs */}
      <Card className="border-dashed">
        <CardContent>
          <Tabs
            value={format}
            onValueChange={(value) => setFormat(value as ColorFormat)}
          >
            <TabsList>
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
                    onChange={(e) =>
                      handleRgbChange("r", Number(e.target.value))
                    }
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
                    onChange={(e) =>
                      handleRgbChange("g", Number(e.target.value))
                    }
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
                    onChange={(e) =>
                      handleRgbChange("b", Number(e.target.value))
                    }
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
                    onChange={(e) =>
                      handleHslChange("h", Number(e.target.value))
                    }
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
                    onChange={(e) =>
                      handleHslChange("s", Number(e.target.value))
                    }
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
                    onChange={(e) =>
                      handleHslChange("l", Number(e.target.value))
                    }
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
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={generateRandomColor}>
          <Wand2 className="h-4 w-4 mr-2" />
          Random
        </Button>
        <Button onClick={copyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <Card className="border-dashed">
          <CardContent>
            <div className="flex items-center mb-2">
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
                              ? (() => {
                                  const rgb = hexToRgb(color.substring(0, 7));
                                  return rgb
                                    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
                                        Number.parseInt(
                                          color.substring(7, 9),
                                          16
                                        ) / 255
                                      })`
                                    : color;
                                })()
                              : color,
                        }}
                        onClick={() => {
                          if (color.length > 7) {
                            setColorFromHex(color.substring(0, 7));
                            setAlpha(
                              Number.parseInt(color.substring(7, 9), 16) / 255
                            );
                          } else {
                            setColorFromHex(color);
                            setAlpha(1);
                          }
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
