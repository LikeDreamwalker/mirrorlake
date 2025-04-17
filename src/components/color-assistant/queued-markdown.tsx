"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ColorHighlightMarkdown } from "./color-highlight-markdown";

interface QueuedMarkdownProps {
  content: string;
  id: string;
  isComplete: boolean;
  releaseInterval?: number;
}

export function QueuedMarkdown({
  content,
  id,
  isComplete,
  releaseInterval = 10, // Default: release every 10ms
}: QueuedMarkdownProps) {
  // The content we're currently displaying
  const [displayedContent, setDisplayedContent] = useState("");

  // All characters in the content, we don't remove from this
  const queueRef = useRef<string[]>([]);

  // How many characters we've displayed so far
  const displayedCountRef = useRef(0);

  // Reference to the animation frame
  const animationFrameRef = useRef<number | null>(null);

  // Last time a character was released
  const lastReleaseTimeRef = useRef(0);

  // Start the rendering process using requestAnimationFrame
  const startRendering = useCallback(() => {
    const renderLoop = (timestamp: number) => {
      // Check if enough time has passed since the last character release
      if (timestamp - lastReleaseTimeRef.current >= releaseInterval) {
        // If we haven't displayed all characters in the queue
        if (displayedCountRef.current < queueRef.current.length) {
          // Get the next character to display
          const nextChar = queueRef.current[displayedCountRef.current];

          // Update the displayed content
          setDisplayedContent((prev) => prev + nextChar);

          // Increment our displayed count
          displayedCountRef.current++;

          // Update the last release time
          lastReleaseTimeRef.current = timestamp;
        } else {
          // If we've displayed all characters, stop the animation
          animationFrameRef.current = null;
          return;
        }
      }

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [releaseInterval]);

  // Update the queue when content changes
  useEffect(() => {
    // Convert the new content to an array
    const contentArray = content.split("");

    // If the new content is longer than what we have in the queue
    if (contentArray.length > queueRef.current.length) {
      // Get only the new characters that aren't in the queue yet
      const newChars = contentArray.slice(queueRef.current.length);

      // Update the queue to include the new characters
      queueRef.current = [...queueRef.current, ...newChars];
      // Start the rendering process if it's not already running
      if (animationFrameRef.current === null) {
        startRendering();
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [content, startRendering]);

  return <ColorHighlightMarkdown content={displayedContent} />;
}
