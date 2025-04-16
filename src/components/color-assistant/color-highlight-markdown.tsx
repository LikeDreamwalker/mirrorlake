"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ColorPreview } from "./color-preview";

// Function to detect and format color codes in text
const formatTextWithColorCodes = (text: string): React.ReactNode[] => {
  // Comprehensive regex to match various color formats - FIXED REGEX
  const colorRegex =
    /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b|rgb$$\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$$|rgba$$\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0?\.\d+|1)\s*$$|hsl$$\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*$$|hsla$$\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*(?:0?\.\d+|1)\s*$$/g;

  // If no color codes are found, return the original text
  if (!text.match(colorRegex)) {
    return [text];
  }

  // Split the text by color codes
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Find all color codes and replace them with ColorPreview components
  while ((match = colorRegex.exec(text)) !== null) {
    // Add text before the color code
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the color preview component
    const colorCode = match[0];
    parts.push(
      <ColorPreview key={`color-${match.index}`} colorCode={colorCode} />
    );

    lastIndex = match.index + colorCode.length;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  console.log(parts, text, "?>?>?>?7777");

  return parts;
};

// Custom component to render markdown with color code highlighting
export function ColorHighlightMarkdown({ content }: { content: string }) {
  // Custom components for ReactMarkdown
  const components: Components = {
    // Override the paragraph renderer to handle color codes
    p: ({ node, children, ...props }) => {
      // If children is a string, process it for color codes
      if (typeof children === "string") {
        return <p {...props}>{formatTextWithColorCodes(children)}</p>;
      }

      // If it's not a string (already processed or contains other elements), return as is
      return <p {...props}>{children}</p>;
    },

    // Override the list item renderer to handle color codes
    li: ({ node, children, ...props }) => {
      // If children is a string, process it for color codes
      if (typeof children === "string") {
        return <li {...props}>{formatTextWithColorCodes(children)}</li>;
      }

      // If it's not a string (already processed or contains other elements), return as is
      return <li {...props}>{children}</li>;
    },

    // Override the strong renderer to handle color codes
    strong: ({ node, children, ...props }) => {
      // If children is a string, process it for color codes
      if (typeof children === "string") {
        return <strong {...props}>{formatTextWithColorCodes(children)}</strong>;
      }

      // If it's not a string (already processed or contains other elements), return as is
      return <strong {...props}>{children}</strong>;
    },

    // Override the emphasis renderer to handle color codes
    em: ({ node, children, ...props }) => {
      // If children is a string, process it for color codes
      if (typeof children === "string") {
        return <em {...props}>{formatTextWithColorCodes(children)}</em>;
      }

      // If it's not a string (already processed or contains other elements), return as is
      return <em {...props}>{children}</em>;
    },

    // Override the code renderer to handle color codes in inline code
    code: ({ node, className, children, ...props }) => {
      // Check if this is a code block with a language specified
      const match = /language-(\w+)/.exec(className || "");
      // If no language match is found, it's an inline code block
      if (!match && children) {
        // FIXED REGEX
        const colorRegex =
          /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b|^rgb$$\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$$|^rgba$$\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0?\.\d+|1)\s*$$|^hsl$$\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*$$|^hsla$$\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*(?:0?\.\d+|1)\s*$$$/;

        if (colorRegex.test(children.toString())) {
          return <ColorPreview colorCode={children.toString()} />;
        }

        // If it's not a color code, render as normal inline code
        return (
          <code
            className="px-1 py-0.5 bg-muted rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      // If it's not inline code, render as a code block
      return (
        <pre className="my-4 p-4 bg-muted rounded-md overflow-x-auto">
          <code className="text-sm font-mono" {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };

  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
