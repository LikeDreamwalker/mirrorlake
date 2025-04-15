"use client";

import type React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore, type ColorFormat } from "@/store";

// Debounce function to limit how often a function is called
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );
}

export default function ColorPicker() {
  const {
    baseColor,
    hue,
    saturation,
    lightness,
    alpha,
    rgb,
    format,
    setHue,
    setSaturation,
    setLightness,
    setAlpha,
    setFormat,
    getFullColor,
    getColorString,
    generateRandomColor,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    currentColor,
    updateCurrentColor,
    updateColorValues, // Add this
  } = useStore();

  // Create debounced versions of the setter functions
  const debouncedSetHue = useDebounce((h: number) => {
    setHue(h);
  }, 300);

  const debouncedSetSaturation = useDebounce((s: number) => {
    setSaturation(s);
  }, 300);

  const debouncedSetLightness = useDebounce((l: number) => {
    setLightness(l);
  }, 300);

  const debouncedSetAlpha = useDebounce((a: number) => {
    setAlpha(a);
  }, 300);

  // For immediate UI feedback, we'll use local state
  const [localHue, setLocalHue] = useState(hue);
  const [localSaturation, setLocalSaturation] = useState(saturation);
  const [localLightness, setLocalLightness] = useState(lightness);
  const [localAlpha, setLocalAlpha] = useState(alpha);

  // Update local state when store values change
  useEffect(() => {
    setLocalHue(hue);
    setLocalSaturation(saturation);
    setLocalLightness(lightness);
    setLocalAlpha(alpha);
  }, [hue, saturation, lightness, alpha]);

  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Local state for input values
  const [hexValue, setHexValue] = useState(getFullColor());
  const [rValue, setRValue] = useState(rgb.r.toString());
  const [gValue, setGValue] = useState(rgb.g.toString());
  const [bValue, setBValue] = useState(rgb.b.toString());
  const [hValue, setHValue] = useState(hue.toString());
  const [sValue, setSValue] = useState(saturation.toString());
  const [lValue, setLValue] = useState(lightness.toString());

  // Validation states
  const [hexError, setHexError] = useState("");
  const [rError, setRError] = useState("");
  const [gError, setGError] = useState("");
  const [bError, setBError] = useState("");
  const [hError, setHError] = useState("");
  const [sError, setSError] = useState("");
  const [lError, setLError] = useState("");

  // Update local state when color changes from outside
  useEffect(() => {
    setHexValue(getFullColor());
    setRValue(rgb.r.toString());
    setGValue(rgb.g.toString());
    setBValue(rgb.b.toString());
    setHValue(hue.toString());
    setSValue(saturation.toString());
    setLValue(lightness.toString());

    // Clear all errors when color changes
    setHexError("");
    setRError("");
    setGError("");
    setBError("");
    setHError("");
    setSError("");
    setLError("");
  }, [getFullColor, rgb.r, rgb.g, rgb.b, hue, saturation, lightness]);

  // Generic function to update wheel position from any pointer event (mouse or touch)
  const updateWheelPosition = useCallback(
    (clientX: number, clientY: number) => {
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
        const x = clientX - rect.left - centerX;
        const y = clientY - rect.top - centerY;

        // Calculate angle (hue) and distance from center (saturation)
        // Math.atan2 returns the angle in radians, convert to degrees
        let angle = Math.atan2(y, x) * (180 / Math.PI);

        // Adjust angle to start from the top (0 degrees) and go clockwise
        angle = (angle + 90) % 360;
        if (angle < 0) angle += 360;

        const radius = rect.width / 2;
        const distance = Math.min(Math.sqrt(x * x + y * y), radius);
        const newSaturation = Math.round((distance / radius) * 100);

        // Update local state immediately for UI feedback only
        setLocalHue(Math.round(angle));
        setLocalSaturation(newSaturation);
      });
    },
    []
  );

  // Add this new debounced function to update the store
  const debouncedUpdateColor = useDebounce(() => {
    // Use the new combined method instead of individual setters
    updateColorValues({
      hue: localHue,
      saturation: localSaturation,
    });
  }, 300);

  // Handle mouse down event
  const handleWheelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateWheelPosition(e.clientX, e.clientY);
  };

  // Handle touch start event
  const handleWheelTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent scrolling while touching the color wheel
    e.preventDefault();
    setIsDragging(true);

    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateWheelPosition(touch.clientX, touch.clientY);
    }
  };

  // Handle mouse/touch move and end events
  useEffect(() => {
    if (!isDragging) return;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      updateWheelPosition(e.clientX, e.clientY);
    };

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateWheelPosition(touch.clientX, touch.clientY);
      }
    };

    // Common end handler for both mouse and touch
    const handleEnd = () => {
      setIsDragging(false);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Update the store once when dragging ends
      debouncedUpdateColor();
    };

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    // Clean up event listeners
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isDragging,
    updateWheelPosition,
    debouncedUpdateColor,
    localHue,
    localSaturation,
  ]);

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    setHexError("");

    // Validate hex format
    if (value && !/^#?[0-9A-Fa-f]{0,8}$/.test(value)) {
      setHexError("Invalid hex format");
      return;
    }
  };

  // Handle hex input blur - apply the color when editing is complete
  const handleHexBlur = () => {
    // If the hex is empty, reset to current color
    if (!hexValue) {
      setHexValue(getFullColor());
      setHexError("");
      return;
    }

    // If the hex is invalid or incomplete, show error and reset
    if (!/^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hexValue)) {
      setHexError("Invalid hex color. Format: #RRGGBB or #RRGGBBAA");
      setHexValue(getFullColor());
      return;
    }

    // Format and apply the hex value
    const formattedValue = hexValue.startsWith("#") ? hexValue : `#${hexValue}`;
    setHexValue(formattedValue.toUpperCase());
    setColorFromHex(formattedValue);
  };

  // Add a key handler to apply the color on Enter key
  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleHexBlur();
    }
  };

  // Handle RGB input changes
  const handleRgbChange = (component: "r" | "g" | "b", value: string) => {
    // Update the local state
    if (component === "r") {
      setRValue(value);
      setRError("");
    }
    if (component === "g") {
      setGValue(value);
      setGError("");
    }
    if (component === "b") {
      setBValue(value);
      setBError("");
    }

    // Validate input
    if (value === "") return; // Allow empty for typing

    const numValue = Number.parseInt(value, 10);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      if (component === "r") setRError("Must be a number");
      if (component === "g") setGError("Must be a number");
      if (component === "b") setBError("Must be a number");
      return;
    }

    // Check if it's in range
    if (numValue < 0 || numValue > 255) {
      if (component === "r") setRError("Must be 0-255");
      if (component === "g") setGError("Must be 0-255");
      if (component === "b") setBError("Must be 0-255");
      return;
    }

    // Only update the color if all values are valid numbers
    const newRgb = {
      r: component === "r" ? numValue : Number.parseInt(rValue, 10) || 0,
      g: component === "g" ? numValue : Number.parseInt(gValue, 10) || 0,
      b: component === "b" ? numValue : Number.parseInt(bValue, 10) || 0,
    };

    // Only update if all values are valid
    if (
      !isNaN(newRgb.r) &&
      !isNaN(newRgb.g) &&
      !isNaN(newRgb.b) &&
      newRgb.r >= 0 &&
      newRgb.r <= 255 &&
      newRgb.g >= 0 &&
      newRgb.g <= 255 &&
      newRgb.b >= 0 &&
      newRgb.b <= 255
    ) {
      setColorFromRgb(newRgb.r, newRgb.g, newRgb.b);
    }
  };

  // Handle RGB input blur - fix any invalid values
  const handleRgbBlur = (component: "r" | "g" | "b") => {
    let value: string;
    if (component === "r") value = rValue;
    else if (component === "g") value = gValue;
    else value = bValue;

    // Handle empty input
    if (value === "") {
      if (component === "r") {
        setRValue(rgb.r.toString());
        setRError("");
      }
      if (component === "g") {
        setGValue(rgb.g.toString());
        setGError("");
      }
      if (component === "b") {
        setBValue(rgb.b.toString());
        setBError("");
      }
      return;
    }

    const numValue = Number.parseInt(value, 10);

    // If invalid, reset to current RGB value
    if (isNaN(numValue) || numValue < 0 || numValue > 255) {
      if (component === "r") {
        setRValue(rgb.r.toString());
        setRError("");
      }
      if (component === "g") {
        setGValue(rgb.g.toString());
        setGError("");
      }
      if (component === "b") {
        setBValue(rgb.b.toString());
        setBError("");
      }
    } else {
      // If valid but different format (e.g., "05" instead of "5"), normalize
      if (component === "r") {
        setRValue(numValue.toString());
        setRError("");
      }
      if (component === "g") {
        setGValue(numValue.toString());
        setGError("");
      }
      if (component === "b") {
        setBValue(numValue.toString());
        setBError("");
      }
    }
  };

  // Handle HSL input changes
  const handleHslChange = (component: "h" | "s" | "l", value: string) => {
    // Update the local state
    if (component === "h") {
      setHValue(value);
      setHError("");
    }
    if (component === "s") {
      setSValue(value);
      setSError("");
    }
    if (component === "l") {
      setLValue(value);
      setLError("");
    }

    // Allow empty for typing
    if (value === "") return;

    const numValue = Number.parseInt(value, 10);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      if (component === "h") setHError("Must be a number");
      if (component === "s") setSError("Must be a number");
      if (component === "l") setLError("Must be a number");
      return;
    }

    // Check if it's in range
    if (component === "h" && (numValue < 0 || numValue > 359)) {
      setHError("Must be 0-359");
      return;
    }
    if (
      (component === "s" || component === "l") &&
      (numValue < 0 || numValue > 100)
    ) {
      if (component === "s") setSError("Must be 0-100");
      if (component === "l") setLError("Must be 0-100");
      return;
    }

    // Only update the color if the value is valid
    const newHsl = {
      h: component === "h" ? numValue : Number.parseInt(hValue, 10) || 0,
      s: component === "s" ? numValue : Number.parseInt(sValue, 10) || 0,
      l: component === "l" ? numValue : Number.parseInt(lValue, 10) || 0,
    };

    // Only update if all values are valid
    if (
      !isNaN(newHsl.h) &&
      !isNaN(newHsl.s) &&
      !isNaN(newHsl.l) &&
      newHsl.h >= 0 &&
      newHsl.h <= 359 &&
      newHsl.s >= 0 &&
      newHsl.s <= 100 &&
      newHsl.l >= 0 &&
      newHsl.l <= 100
    ) {
      setColorFromHsl(newHsl.h, newHsl.s, newHsl.l);
    }
  };

  // Handle HSL input blur - fix any invalid values
  const handleHslBlur = (component: "h" | "s" | "l") => {
    let value: string;
    if (component === "h") value = hValue;
    else if (component === "s") value = sValue;
    else value = lValue;

    // Handle empty input
    if (value === "") {
      if (component === "h") {
        setHValue(hue.toString());
        setHError("");
      }
      if (component === "s") {
        setSValue(saturation.toString());
        setSError("");
      }
      if (component === "l") {
        setLValue(lightness.toString());
        setLError("");
      }
      return;
    }

    const numValue = Number.parseInt(value, 10);

    // If invalid, reset to current HSL value
    if (
      isNaN(numValue) ||
      (component === "h" && (numValue < 0 || numValue > 359)) ||
      ((component === "s" || component === "l") &&
        (numValue < 0 || numValue > 100))
    ) {
      if (component === "h") {
        setHValue(hue.toString());
        setHError("");
      }
      if (component === "s") {
        setSValue(saturation.toString());
        setSError("");
      }
      if (component === "l") {
        setLValue(lightness.toString());
        setLError("");
      }
    } else {
      // If valid but different format, normalize
      if (component === "h") {
        setHValue(numValue.toString());
        setHError("");
      }
      if (component === "s") {
        setSValue(numValue.toString());
        setSError("");
      }
      if (component === "l") {
        setLValue(numValue.toString());
        setLError("");
      }
    }
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

  // Handle lightness slider change with debounce
  const handleLightnessChange = (value: number[]) => {
    setLocalLightness(value[0]);
  };

  // Add a debounced effect for lightness changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateColorValues({ lightness: localLightness });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localLightness, updateColorValues]);

  // Handle alpha slider change with debounce
  const handleAlphaChange = (value: number[]) => {
    setLocalAlpha(value[0]);
  };

  // Add a debounced effect for alpha changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateColorValues({ alpha: localAlpha });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localAlpha, updateColorValues]);

  // Render lightness slider
  const renderLightnessSlider = () => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>Lightness: {localLightness}%</Label>
      </div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={[localLightness]}
        onValueChange={handleLightnessChange}
      />
    </div>
  );

  // Render alpha slider
  const renderAlphaSlider = () => (
    <div className="space-y-2 mt-3">
      <div className="flex justify-between">
        <Label>Alpha: {localAlpha.toFixed(2)}</Label>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[localAlpha]}
        onValueChange={handleAlphaChange}
        style={
          {
            "--slider-track-background": `linear-gradient(to right, 
            rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), 
            rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1))`,
          } as React.CSSProperties
        }
      />
    </div>
  );

  // Calculate marker position correctly based on hue and saturation
  const getMarkerPosition = () => {
    // Convert hue to radians, adjusting to start from the top (270 degrees in standard position)
    const hueRadians = ((localHue - 90) * Math.PI) / 180;

    // Calculate x and y coordinates based on saturation (distance from center)
    const saturationPercent = localSaturation / 100;

    // Calculate position
    const x = 50 + Math.cos(hueRadians) * saturationPercent * 50;
    const y = 50 + Math.sin(hueRadians) * saturationPercent * 50;

    return { x, y };
  };

  // Get marker position
  const markerPosition = getMarkerPosition();

  // Helper to render error message
  const renderErrorMessage = (error: string) => {
    if (!error) return null;
    return (
      <div className="text-destructive text-xs flex items-center mt-1">
        <AlertCircle className="h-3 w-3 mr-1" />
        {error}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap content-start gap-6">
        {/* Left side: Color wheel */}
        <div className="w-full flex flex-col items-center justify-center">
          <div
            className="rounded-xl w-full aspect-square flex items-center justify-center p-4 relative transition-all duration-500"
            style={{
              backgroundColor: currentColor,
            }}
          >
            <div
              ref={wheelRef}
              className="relative w-full max-w-full aspect-square rounded-full cursor-crosshair touch-none shadow-sm"
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
              }}
              onMouseDown={handleWheelMouseDown}
              onTouchStart={handleWheelTouchStart}
              aria-label="Color wheel selector"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={localHue}
              aria-valuetext={`Hue: ${localHue} degrees, Saturation: ${localSaturation}%`}
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
                className="absolute w-6 h-6 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${markerPosition.x}%`,
                  top: `${markerPosition.y}%`,
                  backgroundColor: baseColor,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right side: Color values and inputs */}
        <div className="w-full">
          <Tabs
            value={format}
            onValueChange={(value) => setFormat(value as ColorFormat)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="hex">HEX</TabsTrigger>
              <TabsTrigger value="rgb">RGB</TabsTrigger>
              <TabsTrigger value="hsl">HSL</TabsTrigger>
            </TabsList>

            {/* HEX Format */}
            <TabsContent value="hex" className="mt-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Label
                    htmlFor="hex-input"
                    className="text-sm font-medium mb-1 block"
                  >
                    Hex Value
                  </Label>
                  <Input
                    id="hex-input"
                    value={hexValue}
                    onChange={handleHexChange}
                    onBlur={handleHexBlur}
                    onKeyDown={handleHexKeyDown}
                    className={`font-mono uppercase ${
                      hexError ? "border-destructive" : ""
                    }`}
                    maxLength={9}
                    aria-label="Hex color value"
                    aria-invalid={!!hexError}
                    aria-describedby={hexError ? "hex-error" : undefined}
                  />
                  {renderErrorMessage(hexError)}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  aria-label="Copy hex value"
                  className="mt-6"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* RGB Format */}
            <TabsContent value="rgb" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label
                    htmlFor="rgb-r"
                    className="text-sm font-medium mb-1 block"
                  >
                    R (0-255)
                  </Label>
                  <Input
                    id="rgb-r"
                    type="text"
                    inputMode="numeric"
                    value={rValue}
                    onChange={(e) => handleRgbChange("r", e.target.value)}
                    onBlur={() => handleRgbBlur("r")}
                    className={`font-mono ${
                      rError ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!rError}
                    aria-describedby={rError ? "r-error" : undefined}
                    min="0"
                    max="255"
                  />
                  {renderErrorMessage(rError)}
                </div>
                <div>
                  <Label
                    htmlFor="rgb-g"
                    className="text-sm font-medium mb-1 block"
                  >
                    G (0-255)
                  </Label>
                  <Input
                    id="rgb-g"
                    type="text"
                    inputMode="numeric"
                    value={gValue}
                    onChange={(e) => handleRgbChange("g", e.target.value)}
                    onBlur={() => handleRgbBlur("g")}
                    className={`font-mono ${
                      gError ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!gError}
                    aria-describedby={gError ? "g-error" : undefined}
                    min="0"
                    max="255"
                  />
                  {renderErrorMessage(gError)}
                </div>
                <div>
                  <Label
                    htmlFor="rgb-b"
                    className="text-sm font-medium mb-1 block"
                  >
                    B (0-255)
                  </Label>
                  <Input
                    id="rgb-b"
                    type="text"
                    inputMode="numeric"
                    value={bValue}
                    onChange={(e) => handleRgbChange("b", e.target.value)}
                    onBlur={() => handleRgbBlur("b")}
                    className={`font-mono ${
                      bError ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!bError}
                    aria-describedby={bError ? "b-error" : undefined}
                    min="0"
                    max="255"
                  />
                  {renderErrorMessage(bError)}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <div className="flex-1 p-2 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                  {getColorString()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  aria-label="Copy RGB value"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* HSL Format */}
            <TabsContent value="hsl" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label
                    htmlFor="hsl-h"
                    className="text-sm font-medium mb-1 block"
                  >
                    H (0-359)
                  </Label>
                  <Input
                    id="hsl-h"
                    type="text"
                    inputMode="numeric"
                    value={hValue}
                    onChange={(e) => handleHslChange("h", e.target.value)}
                    onBlur={() => handleHslBlur("h")}
                    className={`font-mono ${
                      hError ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!hError}
                    aria-describedby={hError ? "h-error" : undefined}
                    min="0"
                    max="359"
                  />
                  {renderErrorMessage(hError)}
                </div>
                <div>
                  <Label
                    htmlFor="hsl-s"
                    className="text-sm font-medium mb-1 block"
                  >
                    S (0-100)
                  </Label>
                  <Input
                    id="hsl-s"
                    type="text"
                    inputMode="numeric"
                    value={sValue}
                    onChange={(e) => handleHslChange("s", e.target.value)}
                    onBlur={() => handleHslBlur("s")}
                    className={`font-mono ${
                      sError ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!sError}
                    aria-describedby={sError ? "s-error" : undefined}
                    min="0"
                    max="100"
                  />
                  {renderErrorMessage(sError)}
                </div>
                <div>
                  <Label
                    htmlFor="hsl-l"
                    className="text-sm font-medium mb-1 block"
                  >
                    L (0-100)
                  </Label>
                  <Input
                    id="hsl-l"
                    type="text"
                    inputMode="numeric"
                    value={lValue}
                    onChange={(e) => handleHslChange("l", e.target.value)}
                    onBlur={() => handleHslBlur("l")}
                    className={`font-mono ${
                      lError ? "border-destructive" : ""
                    }`}
                    aria-invalid={!!lError}
                    aria-describedby={lError ? "l-error" : undefined}
                    min="0"
                    max="100"
                  />
                  {renderErrorMessage(lError)}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <div className="flex-1 p-2 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                  {getColorString()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  aria-label="Copy HSL value"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Lightness and Alpha sliders */}
          <div className="w-full mt-4 space-y-4">
            {renderLightnessSlider()}
            {renderAlphaSlider()}
          </div>
        </div>
      </div>
    </div>
  );
}
