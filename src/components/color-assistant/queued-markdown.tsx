"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { ColorHighlightMarkdown } from "./color-highlight-markdown";

interface QueuedMarkdownProps {
  content: string;
  id: string;
  isComplete: boolean;
  releaseInterval?: number;
}

// The main component implementation
function QueuedMarkdownBase({
  content,
  id,
  isComplete,
  releaseInterval = 10, // Default: release every 10ms
}: QueuedMarkdownProps) {
  // The content we're currently displaying
  const [displayedContent, setDisplayedContent] = useState("");

  // Track if we've started animating this message
  const hasStartedRef = useRef(false);

  // Track if this is the first content update
  const isFirstUpdateRef = useRef(true);

  // All characters in the content, we don't remove from this
  const queueRef = useRef<string[]>([]);

  // How many characters we've displayed so far
  const displayedCountRef = useRef(0);

  // Reference to the animation frame
  const animationFrameRef = useRef<number | null>(null);

  // Last time a character was released
  const lastReleaseTimeRef = useRef(0);

  // Store the full content for fallback
  const fullContentRef = useRef("");

  // Reset everything when the message ID changes
  useEffect(() => {
    // Reset state for new messages
    setDisplayedContent("");
    queueRef.current = [];
    displayedCountRef.current = 0;
    hasStartedRef.current = false;
    isFirstUpdateRef.current = true;
    fullContentRef.current = content || "";

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Initialize with the current content if available
    if (content) {
      queueRef.current = content.split("");
      startAnimation();
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [id]); // Only reset when ID changes

  // Start the animation
  const startAnimation = useCallback(() => {
    // Only start if we haven't already started for this message
    if (hasStartedRef.current) return;

    hasStartedRef.current = true;

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

  // Handle content updates (for streaming)
  useEffect(() => {
    // Update the full content reference
    fullContentRef.current = content || "";

    // If no content, don't do anything
    if (!content) return;

    // If this is the first update for this message, we've already handled it in the ID effect
    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false;
      return;
    }

    // For subsequent updates, add new characters to the queue
    const contentArray = content.split("");

    // If the new content is longer than what we have in the queue
    if (contentArray.length > queueRef.current.length) {
      // Get only the new characters that aren't in the queue yet
      const newChars = contentArray.slice(queueRef.current.length);

      // Update the queue to include the new characters
      queueRef.current = [...queueRef.current, ...newChars];

      // Start the animation if it's not already running
      if (animationFrameRef.current === null) {
        startAnimation();
      }
    }
  }, [content, startAnimation]);

  // Fallback mechanism to ensure content is displayed
  useEffect(() => {
    // If content exists but nothing is displaying after 1.5 seconds, show all content
    const fallbackTimer = setTimeout(() => {
      if (fullContentRef.current && displayedContent === "") {
        console.warn(
          "QueuedMarkdown animation may have failed, displaying full content"
        );
        setDisplayedContent(fullContentRef.current);
      }
    }, 1500);

    return () => clearTimeout(fallbackTimer);
  }, [displayedContent]);

  // If content is empty, don't render anything
  if (!content) {
    return null;
  }

  return <ColorHighlightMarkdown content={displayedContent} />;
}

// Export a memoized version to prevent unnecessary re-renders
export const QueuedMarkdown = memo(
  QueuedMarkdownBase,
  (prevProps, nextProps) => {
    // Only re-render if the ID changes or if content changes for the same ID
    return (
      prevProps.id === nextProps.id && prevProps.content === nextProps.content
    );
  }
);
