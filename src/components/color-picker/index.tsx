"use client";

import type React from "react";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Copy, AlertCircle, RefreshCw, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/store";
import { debounce } from "@/lib/utils";
import { colorToName } from "@/app/actions/color";

// Debounce timeout in milliseconds
const DEBOUNCE_TIMEOUT = 50;

export default function ColorPicker() {
  const {
    baseColor,
    hue,
    saturation,
    lightness,
    alpha,
    rgb,
    getFullColor,
    generateRandomColor,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    currentColor,
    updateColorValues,
    getColorName,
    colors,
    removeColor,
    addColor,
  } = useStore();

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

  const [colorName, setColorName] = useState("");

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

  // Create debounced update function
  const debouncedUpdateColor = useCallback(
    debounce(
      (updates: {
        hue?: number;
        saturation?: number;
        lightness?: number;
        alpha?: number;
      }) => {
        updateColorValues(updates);
      },
      DEBOUNCE_TIMEOUT
    ),
    [updateColorValues]
  );

  // Handle lightness slider change
  const handleLightnessChange = (value: number[]) => {
    setLocalLightness(value[0]);
    debouncedUpdateColor({ lightness: value[0] });
  };

  // Handle alpha slider change
  const handleAlphaChange = (value: number[]) => {
    setLocalAlpha(value[0]);
    debouncedUpdateColor({ alpha: value[0] });
  };

  // Update the wheel position function to update color immediately for better responsiveness
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
        let angle = Math.atan2(y, x) * (180 / Math.PI);

        // Adjust angle to start from the top (0 degrees) and go clockwise
        angle = (angle + 90) % 360;
        if (angle < 0) angle += 360;

        const radius = rect.width / 2;
        const distance = Math.min(Math.sqrt(x * x + y * y), radius);
        const newSaturation = Math.round((distance / radius) * 100);
        const newHue = Math.round(angle);

        // Update local state immediately for UI feedback
        setLocalHue(newHue);
        setLocalSaturation(newSaturation);

        // Update the color while dragging for immediate feedback
        if (isDragging) {
          debouncedUpdateColor({
            hue: newHue,
            saturation: newSaturation,
          });
        }
      });
    },
    [isDragging, debouncedUpdateColor]
  );

  // Handle mouse down event
  const handleWheelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateWheelPosition(e.clientX, e.clientY);
  };

  // Handle touch start event
  const handleWheelTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateWheelPosition(touch.clientX, touch.clientY);
    }
  };

  // Common end handler for both mouse and touch
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Ensure the final position is applied
    updateColorValues({
      hue: localHue,
      saturation: localSaturation,
    });
  }, [localHue, localSaturation, updateColorValues]);

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
  }, [isDragging, updateWheelPosition, handleEnd]);

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

      // Only update the color if all values are valid numbers
      const r = component === "r" ? numValue : Number.parseInt(rValue, 10) || 0;
      const g = component === "g" ? numValue : Number.parseInt(gValue, 10) || 0;
      const b = component === "b" ? numValue : Number.parseInt(bValue, 10) || 0;

      // Only update if all values are valid
      if (
        !isNaN(r) &&
        !isNaN(g) &&
        !isNaN(b) &&
        r >= 0 &&
        r <= 255 &&
        g >= 0 &&
        g <= 255 &&
        b >= 0 &&
        b <= 255
      ) {
        setColorFromRgb(r, g, b);
      }
    }
  };

  // Add a key handler to apply RGB values on Enter key
  const handleRgbKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    component: "r" | "g" | "b"
  ) => {
    if (e.key === "Enter") {
      handleRgbBlur(component);
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

      // Only update the color if all values are valid
      const h = component === "h" ? numValue : Number.parseInt(hValue, 10) || 0;
      const s = component === "s" ? numValue : Number.parseInt(sValue, 10) || 0;
      const l = component === "l" ? numValue : Number.parseInt(lValue, 10) || 0;

      // Only update if all values are valid
      if (
        !isNaN(h) &&
        !isNaN(s) &&
        !isNaN(l) &&
        h >= 0 &&
        h <= 359 &&
        s >= 0 &&
        s <= 100 &&
        l >= 0 &&
        l <= 100
      ) {
        setColorFromHsl(h, s, l);
      }
    }
  };

  // Add a key handler to apply HSL values on Enter key
  const handleHslKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    component: "h" | "s" | "l"
  ) => {
    if (e.key === "Enter") {
      handleHslBlur(component);
    }
  };

  // Copy color to clipboard
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast("Copied!", {
      description: `${value} has been copied to clipboard`,
      duration: 2000,
    });
  };

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
    // Convert hue to radians, adjusting to start from the top
    const hueRadians = ((localHue - 90) * Math.PI) / 180;
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

  // Detail Item component for color values
  const DetailItem = ({
    label,
    value,
    onClick,
  }: {
    label: string;
    value: string;
    onClick?: () => void;
  }) => {
    return (
      <div
        className={`p-2 rounded-md bg-muted ${
          onClick ? "cursor-pointer hover:bg-muted/80" : ""
        }`}
        onClick={onClick}
      >
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm truncate">{value}</div>
        {onClick && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center">
            <Copy className="h-3 w-3 mr-1" /> Click to copy
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchColorName = async () => {
      const name = await colorToName(currentColor);
      setColorName(name);
    };
    fetchColorName();
  }, [currentColor]);

  // Find if this color exists in the current theme
  const currentColorInTheme = colors.find(
    (c) => c.color.toLowerCase() === baseColor.toLowerCase()
  );

  // Handle removing the current color from the theme
  const handleRemoveCurrentColor = () => {
    if (currentColorInTheme) {
      removeColor(currentColorInTheme.id);
      toast("Color removed", {
        description: `${baseColor} has been removed from your theme`,
        duration: 2000,
      });
    }
  };

  // Add current color to theme
  const handleAddToTheme = () => {
    // Only add if it doesn't already exist in the theme
    if (!currentColorInTheme) {
      // Use the store's addColor function
      // useStore.getState().addColor(baseColor, colorName);
      addColor(baseColor, colorName);
      toast("Color added", {
        description: `${baseColor} has been added to your theme`,
        duration: 2000,
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {/* Color wheel */}
        <div className="w-full flex flex-col items-center justify-center">
          <div
            className="rounded-xl w-full aspect-square flex items-center justify-center p-4 relative"
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

        {/* Color Details Card */}
        <Card className="p-4">
          <div className="flex items-center mb-3">
            <div
              className="w-12 h-12 rounded-md mr-3"
              style={{ backgroundColor: currentColor }}
            ></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{colorName}</h3>
                <div className="flex gap-2">
                  {currentColorInTheme ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveCurrentColor}
                      className="h-8 w-8"
                      aria-label="Remove color from theme"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddToTheme}
                      className="h-8 w-8"
                      aria-label="Add color to theme"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={generateRandomColor}
                    className="h-8 w-8"
                    aria-label="Generate random color"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Badge variant="outline" className="mt-1">
                {baseColor}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-4">
            {/* HEX Input */}
            <div>
              <Label
                htmlFor="hex-input"
                className="text-sm font-medium mb-1 block"
              >
                HEX Value
              </Label>
              <div className="flex gap-2">
                <Input
                  id="hex-input"
                  value={hexValue}
                  onChange={handleHexChange}
                  onBlur={handleHexBlur}
                  onKeyDown={handleHexKeyDown}
                  className={`font-mono uppercase flex-1 ${
                    hexError ? "border-destructive" : ""
                  }`}
                  maxLength={9}
                  aria-label="Hex color value"
                  aria-invalid={!!hexError}
                  aria-describedby={hexError ? "hex-error" : undefined}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(hexValue)}
                  aria-label="Copy hex value"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {renderErrorMessage(hexError)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Color format values for copying */}
            <DetailItem
              label="HEX"
              value={baseColor}
              onClick={() => copyToClipboard(baseColor)}
            />
            <DetailItem
              label="RGB"
              value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
              onClick={() =>
                copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
              }
            />
            <DetailItem
              label="HSL"
              value={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
              onClick={() =>
                copyToClipboard(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
              }
            />
            <DetailItem
              label="RGBA"
              value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`}
              onClick={() =>
                copyToClipboard(
                  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`
                )
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {/* RGB Inputs */}
            <div>
              <Label htmlFor="rgb-r" className="text-xs font-medium mb-1 block">
                R (0-255)
              </Label>
              <Input
                id="rgb-r"
                type="text"
                inputMode="numeric"
                value={rValue}
                onChange={(e) => handleRgbChange("r", e.target.value)}
                onBlur={() => handleRgbBlur("r")}
                onKeyDown={(e) => handleRgbKeyDown(e, "r")}
                className={`font-mono text-sm h-8 ${
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
              <Label htmlFor="rgb-g" className="text-xs font-medium mb-1 block">
                G (0-255)
              </Label>
              <Input
                id="rgb-g"
                type="text"
                inputMode="numeric"
                value={gValue}
                onChange={(e) => handleRgbChange("g", e.target.value)}
                onBlur={() => handleRgbBlur("g")}
                onKeyDown={(e) => handleRgbKeyDown(e, "g")}
                className={`font-mono text-sm h-8 ${
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
              <Label htmlFor="rgb-b" className="text-xs font-medium mb-1 block">
                B (0-255)
              </Label>
              <Input
                id="rgb-b"
                type="text"
                inputMode="numeric"
                value={bValue}
                onChange={(e) => handleRgbChange("b", e.target.value)}
                onBlur={() => handleRgbBlur("b")}
                onKeyDown={(e) => handleRgbKeyDown(e, "b")}
                className={`font-mono text-sm h-8 ${
                  bError ? "border-destructive" : ""
                }`}
                aria-invalid={!!bError}
                aria-describedby={bError ? "b-error" : undefined}
                min="0"
                max="255"
              />
              {renderErrorMessage(bError)}
            </div>

            {/* HSL Inputs */}
            <div>
              <Label htmlFor="hsl-h" className="text-xs font-medium mb-1 block">
                H (0-359)
              </Label>
              <Input
                id="hsl-h"
                type="text"
                inputMode="numeric"
                value={hValue}
                onChange={(e) => handleHslChange("h", e.target.value)}
                onBlur={() => handleHslBlur("h")}
                onKeyDown={(e) => handleHslKeyDown(e, "h")}
                className={`font-mono text-sm h-8 ${
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
              <Label htmlFor="hsl-s" className="text-xs font-medium mb-1 block">
                S (0-100)
              </Label>
              <Input
                id="hsl-s"
                type="text"
                inputMode="numeric"
                value={sValue}
                onChange={(e) => handleHslChange("s", e.target.value)}
                onBlur={() => handleHslBlur("s")}
                onKeyDown={(e) => handleHslKeyDown(e, "s")}
                className={`font-mono text-sm h-8 ${
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
              <Label htmlFor="hsl-l" className="text-xs font-medium mb-1 block">
                L (0-100)
              </Label>
              <Input
                id="hsl-l"
                type="text"
                inputMode="numeric"
                value={lValue}
                onChange={(e) => handleHslChange("l", e.target.value)}
                onBlur={() => handleHslBlur("l")}
                onKeyDown={(e) => handleHslKeyDown(e, "l")}
                className={`font-mono text-sm h-8 ${
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

          {/* Lightness and Alpha sliders */}
          <div className="w-full space-y-4 mt-4">
            {renderLightnessSlider()}
            {renderAlphaSlider()}
          </div>
        </Card>
      </div>
    </div>
  );
}
