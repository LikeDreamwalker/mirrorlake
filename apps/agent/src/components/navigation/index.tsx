"use client";

import React, { useEffect, useState } from "react";
import {
  Palette,
  MessageSquare,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NavigationControls() {
  const [activeCard, setActiveCard] = useState(0);
  const [needsScrolling, setNeedsScrolling] = useState(false);

  // Card metadata
  const cards = [
    {
      id: "color-picker",
      title: "Picker",
      icon: <Palette className="h-5 w-5" />,
    },
    {
      id: "color-history",
      title: "History",
      icon: <History className="h-5 w-5" />,
    },
    {
      id: "color-assistant",
      title: "Assistant",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  // Check if we need scrolling controls based on screen width
  useEffect(() => {
    const checkScrolling = () => {
      setNeedsScrolling(window.innerWidth < 1024);
    };

    checkScrolling();
    window.addEventListener("resize", checkScrolling);
    return () => window.removeEventListener("resize", checkScrolling);
  }, []);

  // Handle scroll events to update active card
  useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container");

    const handleScroll = () => {
      if (scrollContainer) {
        const scrollPosition = scrollContainer.scrollLeft;
        const containerWidth = scrollContainer.clientWidth;
        const newActiveCard = Math.round(scrollPosition / containerWidth);

        if (
          newActiveCard !== activeCard &&
          newActiveCard >= 0 &&
          newActiveCard < cards.length
        ) {
          setActiveCard(newActiveCard);
        }
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [activeCard, cards.length]);

  // Navigate to a specific card using CSS scrolling
  const scrollToCard = (index: number) => {
    const scrollContainer = document.getElementById("scroll-container");
    const targetSection = document.getElementById(cards[index].id);

    if (scrollContainer && targetSection) {
      // Use scrollIntoView with CSS scroll-behavior: smooth
      targetSection.scrollIntoView({ behavior: "smooth", inline: "start" });
      setActiveCard(index);
    }
  };

  return (
    <div className="flex justify-center w-full h-full">
      <Card className="bg-card rounded-full shadow-md px-4 py-2 flex items-center space-x-3 border">
        {/* Left arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="p-1 rounded-full h-auto w-auto"
          onClick={() => scrollToCard(Math.max(0, activeCard - 1))}
          disabled={activeCard === 0}
          aria-label="Previous card"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5",
              activeCard === 0
                ? "text-muted-foreground/40"
                : "text-muted-foreground"
            )}
          />
        </Button>

        {/* Navigation dots/icons */}
        <div className="flex items-center space-x-4">
          {cards.map((card, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => scrollToCard(index)}
              className={cn(
                "flex items-center rounded-full transition-all p-1.5 h-auto",
                activeCard === index ? "bg-primary/10" : "hover:bg-muted"
              )}
              aria-label={`Go to ${card.title}`}
              aria-current={activeCard === index ? "page" : undefined}
            >
              {/* Clone the icon element with the appropriate classes */}
              {React.cloneElement(card.icon, {
                className: cn(
                  "h-5 w-5",
                  activeCard === index
                    ? "text-primary"
                    : "text-muted-foreground"
                ),
              })}

              {/* Show text labels on larger screens */}
              <span
                className={cn(
                  "ml-1.5 text-sm hidden md:inline-block",
                  activeCard === index
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {card.title}
              </span>
            </Button>
          ))}
        </div>

        {/* Right arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="p-1 rounded-full h-auto w-auto"
          onClick={() =>
            scrollToCard(Math.min(cards.length - 1, activeCard + 1))
          }
          disabled={activeCard === cards.length - 1}
          aria-label="Next card"
        >
          <ChevronRight
            className={cn(
              "h-5 w-5",
              activeCard === cards.length - 1
                ? "text-muted-foreground/40"
                : "text-muted-foreground"
            )}
          />
        </Button>
      </Card>
    </div>
  );
}
