import type { JSX } from "react";

interface InvisibleSEOHeadingProps {
  title: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * A component that renders a heading for SEO purposes but keeps it visually hidden
 * This maintains semantic structure without affecting your design
 */
export default function InvisibleSEOHeading({
  title,
  level = 1,
}: InvisibleSEOHeadingProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return <HeadingTag className="sr-only">{title}</HeadingTag>;
}
