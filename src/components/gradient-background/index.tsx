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

// Playlist item interface
interface PlaylistItem {
  colors: string[];
  id: number; // Unique identifier for tracking
}

export function GradientBackground({
  className,
  transitionSpeed = 10,
}: GradientBackgroundProps) {
  const { colors } = useStore();
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Playlist state
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [playlistIdCounter, setPlaylistIdCounter] = useState(0);

  // Current visible layers
  const [currentLayer, setCurrentLayer] = useState<string[]>([]);
  const [nextLayer, setNextLayer] = useState<string[]>([]);

  // Track if colors have changed
  const [colorsChanged, setColorsChanged] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastColorsRef = useRef<string[]>([]);

  // Generate color sets when colors change
  const colorSets = useMemo(() => {
    const themeColors = colors.map((item) => item.color);

    // Check if colors have changed
    const hasChanged =
      JSON.stringify(themeColors) !== JSON.stringify(lastColorsRef.current);
    if (hasChanged) {
      setColorsChanged(true);
    }
    lastColorsRef.current = themeColors;

    // Generate color sets and ensure each set has at least 2 colors
    const sets = generateRandomColorSets(themeColors);

    // Ensure we have at least 2 sets for transitions
    if (sets.length < 2) {
      return [...sets, ...sets];
    }

    return sets;
  }, [colors]);

  // Initialize or update playlist when colorSets change
  useEffect(() => {
    if (colorSets.length === 0) return;

    // Check if this is initial setup
    if (playlist.length === 0) {
      // Create initial playlist with IDs
      const initialPlaylist = colorSets.map((colors, index) => ({
        colors,
        id: index,
      }));
      setPlaylist(initialPlaylist);
      setPlaylistIdCounter(colorSets.length);

      // Set initial layers
      setCurrentLayer(colorSets[0]);
      setNextLayer(colorSets[1]);

      return;
    }

    // If colors have changed, update the playlist
    if (colorsChanged) {
      // Create new playlist items for the new color sets
      let newIdCounter = playlistIdCounter;
      const newItems = colorSets.map((colors) => {
        newIdCounter++;
        return { colors, id: newIdCounter };
      });

      // Update the playlist:
      // If we're currently transitioning, keep both current and next items
      // Otherwise, just keep the current item
      if (isTransitioning) {
        setPlaylist([playlist[currentIndex], playlist[nextIndex], ...newItems]);
      } else {
        // Not transitioning, so we only need to keep the current item
        setPlaylist([playlist[currentIndex], ...newItems]);
        // Update the next index to point to the first new item
        setNextIndex(1);
      }

      setPlaylistIdCounter(newIdCounter);
      setColorsChanged(false);
    }
  }, [colorSets, colorsChanged, isTransitioning]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || playlist.length < 2) return;

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

        // If transition complete, move to next color set in playlist
        if (newProgress >= 1) {
          // Move to next item in playlist
          const newCurrentIndex = nextIndex;
          const newNextIndex = (nextIndex + 1) % playlist.length;

          setCurrentIndex(newCurrentIndex);
          setNextIndex(newNextIndex);

          // Update the current and next layers
          setCurrentLayer(playlist[newCurrentIndex].colors);
          setNextLayer(playlist[newNextIndex].colors);

          setIsTransitioning(false);
          return 0;
        }

        setIsTransitioning(true);
        return newProgress;
      });

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw current layer (fading out)
      drawGradientLayer(
        ctx,
        canvas.width,
        canvas.height,
        currentLayer,
        1 - progress
      );

      // Draw next layer (fading in)
      drawGradientLayer(ctx, canvas.width, canvas.height, nextLayer, progress);

      animationRef.current = requestAnimationFrame(animate);
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
  }, [
    playlist,
    currentLayer,
    nextLayer,
    currentIndex,
    nextIndex,
    progress,
    transitionSpeed,
    isTransitioning,
  ]);

  // Update layers when playlist or indices change
  useEffect(() => {
    if (playlist.length < 2) return;

    // Ensure we always have the correct layers based on current indices
    setCurrentLayer(playlist[currentIndex]?.colors || ["#ffffff"]);
    setNextLayer(playlist[nextIndex]?.colors || ["#ffffff"]);
  }, [playlist, currentIndex, nextIndex]);

  // Draw a single gradient layer with opacity
  function drawGradientLayer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: string[],
    opacity: number
  ) {
    // Safety check for empty colors
    if (!colors || colors.length === 0) {
      return;
    }

    // Save current context state
    ctx.save();

    // Set global alpha for this layer
    ctx.globalAlpha = opacity;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    // Handle edge cases for color stops
    if (colors.length === 1) {
      // Only one color, use solid fill
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, width, height);
    } else {
      // Add color stops for multiple colors
      colors.forEach((color, index) => {
        const stopPosition = index / (colors.length - 1);
        gradient.addColorStop(stopPosition, color);
      });

      // Fill canvas
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Restore context state
    ctx.restore();
  }

  return (
    <div className={cn("w-full h-full bg-background", className)}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
