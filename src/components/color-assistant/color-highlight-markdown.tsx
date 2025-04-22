"use client";

import type React from "react";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ColorPreview } from "./color-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, ImageOff } from "lucide-react";
import Image from "next/image";

// Shared regex patterns for color formats
const COLOR_REGEX_PATTERNS = [
  "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\\b", // Hex colors
  "^rgb\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*\\)$", // RGB
  "^rgba\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*(?:0?\\.\\d+|1(?:\\.0{1,2})?)\\s*\\)$", // RGBA
  "^hsl\\(\\s*\\d{1,3}\\s*°?\\s*,\\s*\\d{1,3}%\\s*,\\s*\\d{1,3}%\\s*\\)$", // HSL
  "^hsla\\(\\s*\\d{1,3}\\s*°?\\s*,\\s*\\d{1,3}%\\s*,\\s*\\d{1,3}%\\s*,\\s*(?:0?\\.\\d+|1(?:\\.0{1,2})?)\\s*\\)$", // HSLA
  "^hsv\\(\\s*\\d{1,3}\\s*°?\\s*,\\s*\\d{1,3}%\\s*,\\s*\\d{1,3}%\\s*\\)$", // HSV
  "^cmyk\\(\\s*\\d{1,3}%?\\s*,\\s*\\d{1,3}%?\\s*,\\s*\\d{1,3}%?\\s*,\\s*\\d{1,3}%?\\s*\\)$", // CMYK
];

// Utility function to create a regex from the shared patterns
const createColorRegex = (flags = ""): RegExp =>
  new RegExp(COLOR_REGEX_PATTERNS.join("|"), flags);

// Function to check if a string is a valid color code
export const isColorCode = (text: string): boolean => {
  const colorRegex = createColorRegex();
  return colorRegex.test(text);
};

// Function to find all color codes in a string
export const findColorCodes = (text: string): RegExpMatchArray | null => {
  const colorRegex = createColorRegex("g"); // Global flag to find all matches
  return text.match(colorRegex);
};

// Function to detect and format color codes in text
const formatTextWithColorCodes = (
  text: string,
  reverseTheme?: boolean
): React.ReactNode[] => {
  // Use the shared utility to find color codes
  const matches = findColorCodes(text);

  // If no color codes are found, return the original text
  if (!matches) {
    return [text];
  }

  // Split the text by color codes
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Create a copy of the text to work with
  const textCopy = text.toString();
  const colorRegex = createColorRegex("g");

  // Find all color codes and replace them with ColorPreview components
  let match;
  while ((match = colorRegex.exec(textCopy)) !== null) {
    // Add text before the color code
    if (match.index > lastIndex) {
      parts.push(textCopy.substring(lastIndex, match.index));
    }

    // Add the color preview component
    const colorCode = match[0];
    parts.push(
      <ColorPreview
        key={`color-${match.index}`}
        colorCode={colorCode}
        reverseTheme={reverseTheme}
      />
    );

    lastIndex = match.index + colorCode.length;
  }

  // Add any remaining text
  if (lastIndex < textCopy.length) {
    parts.push(textCopy.substring(lastIndex));
  }

  return parts;
};

// Base component implementation
function ColorHighlightMarkdownBase({
  content,
  reasoning,
  reverseTheme,
}: {
  content: string;
  reasoning?: string;
  reverseTheme?: boolean;
}) {
  // Use useMemo to create components only when needed
  const components = useMemo<Components>(
    () => ({
      // Headings
      h1: ({ children, ...props }) => (
        <h1
          className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6"
          {...props}
        >
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4"
          {...props}
        >
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4"
          {...props}
        >
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4
          className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3"
          {...props}
        >
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5
          className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2"
          {...props}
        >
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6
          className="scroll-m-20 text-base font-semibold tracking-tight mt-6 mb-2"
          {...props}
        >
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </h6>
      ),

      // Paragraphs and text
      p: ({ children, ...props }) => (
        <span className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </span>
      ),
      strong: ({ children, ...props }) => (
        <strong className="font-semibold" {...props}>
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </em>
      ),

      // Lists
      ul: ({ children, ...props }) => (
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="mt-2" {...props}>
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </li>
      ),

      // Blockquotes - using Card component
      blockquote: ({ children }) => (
        <Card className="my-6 border-l-4 border-l-primary bg-background">
          <CardContent className="pt-6">
            <div className="italic text-muted-foreground">{children}</div>
          </CardContent>
        </Card>
      ),

      // Links - using Next.js Link for internal links
      a: ({ href, children, ...props }) => {
        const isInternalLink = href?.startsWith("/") || href?.startsWith("#");

        if (isInternalLink && href) {
          return (
            <Link
              href={href}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              {...props}
            >
              {typeof children === "string"
                ? formatTextWithColorCodes(children, reverseTheme)
                : children}
            </Link>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={href}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {typeof children === "string"
                    ? formatTextWithColorCodes(children, reverseTheme)
                    : children}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Opens in a new tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },

      // Text nodes - this is key for detecting colors in regular text
      text: ({ children }) => {
        if (typeof children !== "string") {
          return <>{children}</>;
        }
        return <>{formatTextWithColorCodes(children, reverseTheme)}</>;
      },

      // Tables - using shadcn/ui Table components
      table: ({ children, ...props }) => (
        <Card className="my-6 w-full overflow-y-auto bg-background">
          <Table {...props}>{children}</Table>
        </Card>
      ),
      thead: ({ children, ...props }) => (
        <TableHeader {...props}>{children}</TableHeader>
      ),
      tbody: ({ children, ...props }) => (
        <TableBody {...props}>{children}</TableBody>
      ),
      tr: ({ children, ...props }) => (
        <TableRow {...props}>{children}</TableRow>
      ),
      th: ({ children, ...props }) => (
        <TableHead {...props}>
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </TableHead>
      ),
      td: ({ children, ...props }) => (
        <TableCell {...props}>
          {typeof children === "string"
            ? formatTextWithColorCodes(children, reverseTheme)
            : children}
        </TableCell>
      ),

      // Horizontal rule - using Separator
      hr: ({ ...props }) => <Separator className="my-6" {...props} />,

      // Images - using Next.js Image component
      img: ({ src, alt }) => {
        // For external images or if src is undefined
        if (!src || (typeof src === "string" && src.startsWith("http"))) {
          return (
            <Card className="flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 bg-background p-8 text-muted-foreground">
              <ImageOff className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-sm font-medium">{alt || "Image"}</span>
              <span className="text-xs mt-1 max-w-xs text-center">
                This image is not available or is an external link. Click to
                view it.
              </span>
            </Card>
          );
        }

        // For local images
        return (
          <div className="my-6 relative">
            <div
              className="relative w-full max-w-3xl mx-auto h-auto rounded-md border overflow-hidden"
              style={{ maxHeight: "30rem" }}
            >
              <Image
                src={
                  typeof src === "string"
                    ? src
                    : src
                    ? URL.createObjectURL(src)
                    : "/placeholder.svg"
                }
                alt={alt || ""}
                width={800}
                height={600}
                className="object-contain w-full h-auto max-h-[30rem]"
                unoptimized
              />
            </div>
            {alt && (
              <span className="mt-2 text-center text-sm text-muted-foreground">
                {alt}
              </span>
            )}
          </div>
        );
      },

      // Override the code renderer to handle color codes in inline code
      code: ({ className, children, ...props }) => {
        // Check if this is a code block with a language specified
        const match = /language-(\w+)/.exec(className || "");
        // If no language match is found, it's an inline code block
        if (!match && children) {
          // Use the shared utility to check if it's a color code
          if (isColorCode(children.toString())) {
            return (
              <ColorPreview
                colorCode={children.toString()}
                reverseTheme={reverseTheme}
              />
            );
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
    }),
    []
  ); // Empty dependency array ensures components are created only once

  return (
    <>
      {reasoning && (
        <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
          <details>
            <summary className="cursor-pointer font-medium">Reasoning</summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{reasoning}</pre>
          </details>
        </div>
      )}
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </>
  );
}

// Export memoized version
export const ColorHighlightMarkdown = memo(
  ColorHighlightMarkdownBase,
  // Simple equality check for the content prop
  (prevProps, nextProps) => prevProps.content === nextProps.content
);
