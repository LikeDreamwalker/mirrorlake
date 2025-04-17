"use client";

import React, { ReactElement } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ExternalLink, AlertCircle, Info, ImageOff } from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    // Headings
    h1: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"h1"> & { node?: any }) => (
      <h1
        className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"h2"> & { node?: any }) => (
      <h2
        className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"h3"> & { node?: any }) => (
      <h3
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"h4"> & { node?: any }) => (
      <h4
        className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"h5"> & { node?: any }) => (
      <h5
        className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"h6"> & { node?: any }) => (
      <h6
        className="scroll-m-20 text-base font-semibold tracking-tight mt-6 mb-2"
        {...props}
      >
        {children}
      </h6>
    ),

    // Paragraphs and text
    p: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"p"> & { node?: any }) => (
      <span className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
        {children}
      </span>
    ),
    strong: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"strong"> & { node?: any }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"em"> & { node?: any }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Lists
    ul: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"ul"> & { node?: any }) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"ol"> & { node?: any }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),
    li: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"li"> & { node?: any }) => (
      <li className="mt-2" {...props}>
        {children}
      </li>
    ),

    // Blockquotes - using Card component
    blockquote: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"blockquote"> & { node?: any }) => (
      <Card className="my-6 border-l-4 border-l-primary bg-background">
        <CardContent className="pt-6">
          <div className="italic text-muted-foreground">{children}</div>
        </CardContent>
      </Card>
    ),

    // Links - using Next.js Link for internal links
    a: ({
      node,
      href,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"a"> & { node?: any }) => {
      const isInternalLink = href?.startsWith("/") || href?.startsWith("#");

      if (isInternalLink && href) {
        return (
          <Link
            href={href}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            {...props}
          >
            {children}
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
                {children}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </TooltipTrigger>
            <TooltipContent>Opens in a new tab</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },

    // Tables - using shadcn/ui Table components
    table: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"table"> & { node?: any }) => (
      <Card className="my-6 w-full overflow-y-auto bg-background">
        <Table {...props}>{children}</Table>
      </Card>
    ),
    thead: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"thead"> & { node?: any }) => (
      <TableHeader {...props}>{children}</TableHeader>
    ),
    tbody: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"tbody"> & { node?: any }) => (
      <TableBody {...props}>{children}</TableBody>
    ),
    tr: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"tr"> & { node?: any }) => (
      <TableRow {...props}>{children}</TableRow>
    ),
    th: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"th"> & { node?: any }) => (
      <TableHead {...props}>{children}</TableHead>
    ),
    td: ({
      node,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"td"> & { node?: any }) => (
      <TableCell {...props}>{children}</TableCell>
    ),

    // Horizontal rule - using Separator
    hr: ({
      node,
      ...props
    }: React.ComponentPropsWithoutRef<"hr"> & { node?: any }) => (
      <Separator className="my-6" {...props} />
    ),

    // Images - using Next.js Image component
    img: ({
      node,
      src = "",
      alt = "",
      ...props
    }: React.ComponentPropsWithoutRef<"img"> & {
      node?: any;
      src?: string;
      alt?: string;
    }) => {
      // For external images or if src is undefined
      if (!src || src.startsWith("http")) {
        return (
          <Card className="flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 bg-background p-8 text-muted-foreground">
            <ImageOff className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">{alt}</span>
            <span className="text-xs mt-1 max-w-xs text-center">
              This image is not available or is an external link. Click to view
              it.
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
              src={src || "/placeholder.svg"}
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

    // Details/Summary - using Accordion
    details: ({
      node,
      children,
      open,
      ...props
    }: React.ComponentPropsWithoutRef<"details"> & {
      node?: any;
      children?: React.ReactNode;
      open?: boolean;
    }) => {
      // Find the summary and content
      let summary = "";
      let content: React.ReactNode = null;

      React.Children.forEach(children, (child) => {
        // Type assertion to tell TypeScript this is a valid element with props
        const childElement = child as ReactElement;

        // Now check if it's a summary element
        if (childElement.type === "summary") {
          // Use any to make TypeScript happy
          summary = (childElement.props as any).children;
        } else {
          content = childElement;
        }
      });

      return (
        <Accordion
          type="single"
          collapsible
          className="my-4"
          defaultValue={open ? "item-1" : undefined}
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>{summary}</AccordionTrigger>
            <AccordionContent>{content}</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    },

    // Custom components for callouts/admonitions
    div: ({
      node,
      className,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"div"> & {
      node?: any;
      className?: string;
      children?: React.ReactNode;
    }) => {
      // Check if this is a callout/admonition
      if (className?.includes("callout") || className?.includes("admonition")) {
        const isWarning = className?.includes("warning");
        const isInfo = className?.includes("info");
        const isNote = className?.includes("note");
        const isSuccess = className?.includes("success");

        let icon = <Info className="h-4 w-4" />;
        let title = "Note";
        let variant: "default" | "destructive" = "default";

        if (isWarning) {
          icon = <AlertCircle className="h-4 w-4" />;
          title = "Warning";
          variant = "destructive";
        } else if (isSuccess) {
          icon = <Check className="h-4 w-4" />;
          title = "Success";
        }

        return (
          <Alert variant={variant} className="my-6">
            {icon}
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{children}</AlertDescription>
          </Alert>
        );
      }

      // Default div rendering
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
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
