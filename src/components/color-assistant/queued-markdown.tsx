"use client";

import { useEffect, useState, useRef } from "react";
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

  // Debug ref to track if we're updating
  const isUpdatingRef = useRef(false);

  // Reference to the timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple approach: use a direct effect to update the displayed content
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If content is empty or we already have all the content displayed, do nothing
    if (!content || content === displayedContent) {
      return;
    }

    // Log for debugging
    console.log("Content changed, starting display", {
      contentLength: content.length,
      displayedLength: displayedContent.length,
      isUpdating: isUpdatingRef.current,
    });

    // Mark that we're updating
    isUpdatingRef.current = true;

    // Function to add one character at a time
    const addNextChar = () => {
      setDisplayedContent((prev) => {
        // If we've displayed all content, stop
        if (prev.length >= content.length) {
          isUpdatingRef.current = false;
          return prev;
        }

        // Add the next character
        const nextChar = content[prev.length];
        const newContent = prev + nextChar;

        // Schedule the next character
        timeoutRef.current = setTimeout(addNextChar, releaseInterval);

        return newContent;
      });
    };

    // Start adding characters
    addNextChar();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, releaseInterval]);

  // Log for debugging
  useEffect(() => {
    console.log("dc7777", displayedContent);
  }, [displayedContent]);

  useEffect(() => {
    console.log("content7777", content);
  }, [content]);

  // If content is empty, don't render anything
  if (!content) {
    return null;
  }

  return <ColorHighlightMarkdown content={displayedContent} />;
}
