"use client";

import type React from "react";
import { useRef, useCallback, useEffect, useMemo } from "react";
import { useColorPicker } from "./context";
import { useColorStore } from "@/provider";

export function ColorWheel() {
  const {
    localHue,
    localSaturation,
    setLocalHue,
    setLocalSaturation,
    isDragging,
    setIsDragging,
  } = useColorPicker();

  const { currentColorInfo, currentColor, updateColorValues, setColorFromHex } =
    useColorStore((state) => ({
      currentColorInfo: state.currentColorInfo,
      currentColor: state.currentColor,
      updateColorValues: state.updateColorValues,
      setColorFromHex: state.setColorFromHex,
    }));

  // Memoize the color value to avoid unnecessary re-renders
  const color = useMemo(() => currentColorInfo.color, [currentColorInfo.color]);

  const wheelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update the wheel position function to update local state only, not the actual color
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

        // Removed the debounced update during dragging
      });
    },
    [setLocalHue, setLocalSaturation]
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

  // Handle click on the wheel (for single click color selection)
  const handleWheelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    updateWheelPosition(e.clientX, e.clientY);

    // Update the actual color on click
    updateColorValues({
      hue: localHue,
      saturation: localSaturation,
    });
  };

  // Common end handler for both mouse and touch
  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Only update the actual color when dragging ends
      updateColorValues({
        hue: localHue,
        saturation: localSaturation,
      });
    }
  }, [localHue, localSaturation, updateColorValues, setIsDragging, isDragging]);

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

  // Calculate marker position correctly based on hue and saturation
  const getMarkerPosition = () => {
    // Convert hue to radians, adjusting to start from the top
    const hueRadians = ((localHue - 90) * Math.PI) / 180;
    const saturationPercent = localSaturation / 100;

    // Calculate position
    const x = 50 + Math.cos(hueRadians) * saturationPercent * 50;
    const y = 50 + Math.sin(hueRadians) * saturationPercent * 50;

    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  };

  // Get marker position
  const markerPosition = getMarkerPosition();

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        className="rounded-xl w-full aspect-square flex items-center justify-center p-4 relative"
        style={{
          backgroundColor: currentColor,
          transitionBehavior: "background-color",
          transitionDuration: "0.3s",
          transitionProperty: "background-color",
          willChange: "background-color",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
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
          onClick={handleWheelClick}
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
              backgroundColor: isDragging
                ? `hsl(${localHue}, ${localSaturation}%, 50%)`
                : color,
              transitionBehavior: "background-color",
              transitionDuration: "0.3s",
              transitionProperty: "background-color",
              willChange: "background-color",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
