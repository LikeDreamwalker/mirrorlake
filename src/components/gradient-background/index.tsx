"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";

interface GradientBackgroundProps {
  className?: string;
  colorSets?: string[][];
  transitionSpeed?: number;
}

/**
 * Generates random color sets from an array of colors
 * @param colors Array of colors to choose from
 * @param numSets Number of color sets to generate
 * @param minSize Minimum size of each color set
 * @param maxSize Maximum size of each color set
 * @returns Array of color sets
 */
export function generateRandomColorSets(
  colors: string[],
  numSets = 5,
  minSize = 2,
  maxSize = 4
): string[][] {
  // Validate inputs
  if (!colors.length) return [["#ffffff"]]; // Return default white if no colors
  if (minSize < 1) minSize = 1;
  if (maxSize < minSize) maxSize = minSize;

  const result: string[][] = [];

  for (let i = 0; i < numSets; i++) {
    // Determine random size for this set between min and max
    const setSize =
      Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;

    // Create a copy of colors array to avoid duplicates in a single set
    const availableColors = [...colors];
    const colorSet: string[] = [];

    // Fill the set with random colors
    for (let j = 0; j < setSize && availableColors.length > 0; j++) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      colorSet.push(availableColors[randomIndex]);
      // Remove the selected color to avoid duplicates in this set
      availableColors.splice(randomIndex, 1);
    }

    // If we couldn't get enough colors, duplicate the last one
    if (colorSet.length === 0) {
      colorSet.push("#ffffff"); // Default fallback
    } else if (colorSet.length === 1) {
      // Duplicate the single color to create a valid gradient
      colorSet.push(colorSet[0]);
    }

    result.push(colorSet);
  }

  return result;
}

export function GradientBackground({
  className,
  transitionSpeed = 10,
}: GradientBackgroundProps) {
  const { colors } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const colorSets = useMemo(() => {
    const themeColors = colors.map((item) => item.color);
    // Generate color sets and ensure each set has at least 2 colors
    const sets = generateRandomColorSets(themeColors);

    // Ensure we have at least 2 sets for transitions
    if (sets.length < 2) {
      return [...sets, ...sets];
    }

    return sets;
  }, [colors]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation function
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update progress
      setProgress((prev) => {
        const newProgress = prev + (deltaTime / 1000) * (transitionSpeed / 100);

        // If transition complete, move to next color set
        if (newProgress >= 1) {
          setCurrentIndex(nextIndex);
          setNextIndex((nextIndex + 1) % colorSets.length);
          return 0;
        }

        return newProgress;
      });

      // Draw gradient
      drawGradient(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Draw gradient function
    const drawGradient = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Safety check for empty color sets
      if (
        colorSets.length === 0 ||
        !colorSets[currentIndex] ||
        !colorSets[nextIndex]
      ) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        return;
      }

      const currentColors = colorSets[currentIndex];
      const nextColors = colorSets[nextIndex];

      // Calculate interpolated colors
      const interpolatedColors = currentColors.map((color, i) => {
        const nextColor = nextColors[i % nextColors.length];
        return interpolateColor(color, nextColor, progress);
      });

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);

      // Handle edge cases for color stops
      if (interpolatedColors.length === 0) {
        // No colors available, use white
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        return;
      } else if (interpolatedColors.length === 1) {
        // Only one color, use solid fill
        ctx.fillStyle = interpolatedColors[0];
        ctx.fillRect(0, 0, width, height);
        return;
      }

      // Add color stops for multiple colors
      interpolatedColors.forEach((color, index) => {
        const stopPosition = index / (interpolatedColors.length - 1);
        gradient.addColorStop(stopPosition, color);
      });

      // Fill canvas
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [colorSets, currentIndex, nextIndex, progress, transitionSpeed]);

  return (
    <div className={cn("w-full h-full bg-background", className)}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// Helper function to interpolate between two colors
function interpolateColor(
  color1: string,
  color2: string,
  factor: number
): string {
  // Convert hex to RGB
  const parseColor = (hexColor: string) => {
    const hex = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;
    const bigint = Number.parseInt(hex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  // Interpolate RGB values
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));

  // Convert back to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
