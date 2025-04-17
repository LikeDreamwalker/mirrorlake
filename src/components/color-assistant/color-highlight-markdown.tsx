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

// Custom component to render markdown with color code highlighting
export function ColorHighlightMarkdown({ content }: { content: string }) {
  // Custom components for ReactMarkdown
  const components: Components = {
    // Headings
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
      <h1
        className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
      <h2
        className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
      <h3
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => (
      <h4
        className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: React.ComponentPropsWithoutRef<"h5">) => (
      <h5
        className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: React.ComponentPropsWithoutRef<"h6">) => (
      <h6
        className="scroll-m-20 text-base font-semibold tracking-tight mt-6 mb-2"
        {...props}
      >
        {children}
      </h6>
    ),

    // Paragraphs and text
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
      <span className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
        {children}
      </span>
    ),
    strong: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"strong">) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.ComponentPropsWithoutRef<"em">) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Lists
    ul: ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
      <li className="mt-2" {...props}>
        {children}
      </li>
    ),

    // Blockquotes - using Card component
    blockquote: ({
      children,
    }: React.ComponentPropsWithoutRef<"blockquote">) => (
      <Card className="my-6 border-l-4 border-l-primary bg-background">
        <CardContent className="pt-6">
          <div className="italic text-muted-foreground">{children}</div>
        </CardContent>
      </Card>
    ),

    // Links - using Next.js Link for internal links
    a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<"a">) => {
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
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"table">) => (
      <Card className="my-6 w-full overflow-y-auto bg-background">
        <Table {...props}>{children}</Table>
      </Card>
    ),
    thead: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"thead">) => (
      <TableHeader {...props}>{children}</TableHeader>
    ),
    tbody: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"tbody">) => (
      <TableBody {...props}>{children}</TableBody>
    ),
    tr: ({ children, ...props }: React.ComponentPropsWithoutRef<"tr">) => (
      <TableRow {...props}>{children}</TableRow>
    ),
    th: ({ children, ...props }: React.ComponentPropsWithoutRef<"th">) => (
      <TableHead {...props}>{children}</TableHead>
    ),
    td: ({ children, ...props }: React.ComponentPropsWithoutRef<"td">) => (
      <TableCell {...props}>{children}</TableCell>
    ),

    // Horizontal rule - using Separator
    hr: ({ ...props }: React.ComponentPropsWithoutRef<"hr">) => (
      <Separator className="my-6" {...props} />
    ),

    // Images - using Next.js Image component
    img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      // For external images or if src is undefined
      if (!src || (typeof src === "string" && src.startsWith("http"))) {
        return (
          <Card className="flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 bg-background p-8 text-muted-foreground">
            <ImageOff className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">{alt || "Image"}</span>
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

    // Details/Summary - using Accordion
    details: ({
      children,
      open,
    }: React.ComponentPropsWithoutRef<"details"> & {
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
          // Use React.PropsWithChildren to type the props
          const props = childElement.props as React.PropsWithChildren<object>;
          summary = React.Children.toArray(props.children).join("");
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
      className,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"div"> & {
      className?: string;
      children?: React.ReactNode;
    }) => {
      // Check if this is a callout/admonition
      if (className?.includes("callout") || className?.includes("admonition")) {
        const isWarning = className?.includes("warning");
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
    code: ({ className, children, ...props }) => {
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
