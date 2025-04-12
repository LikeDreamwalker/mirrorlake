"use client";

import React from "react";
import { useEffect, useState } from "react";
import {
  Palette,
  MessageSquare,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10">
      <div className="bg-white rounded-full shadow-md px-4 py-2 flex items-center space-x-3">
        {/* Left arrow */}
        <button
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => scrollToCard(Math.max(0, activeCard - 1))}
          disabled={activeCard === 0}
          aria-label="Previous card"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5",
              activeCard === 0 ? "text-gray-300" : "text-gray-700"
            )}
          />
        </button>

        {/* Navigation dots/icons */}
        <div className="flex items-center space-x-4">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={cn(
                "flex items-center rounded-full transition-all p-1.5",
                activeCard === index ? "bg-blue-100" : "hover:bg-gray-100"
              )}
              aria-label={`Go to ${card.title}`}
            >
              {/* Clone the icon element with the appropriate classes */}
              {React.cloneElement(card.icon, {
                className: cn(
                  "h-5 w-5",
                  activeCard === index ? "text-blue-500" : "text-gray-500"
                ),
              })}

              {/* Show text labels on larger screens */}
              <span
                className={cn(
                  "ml-1.5 text-sm hidden md:inline-block",
                  activeCard === index
                    ? "text-blue-500 font-medium"
                    : "text-gray-500"
                )}
              >
                {card.title}
              </span>
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
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
                ? "text-gray-300"
                : "text-gray-700"
            )}
          />
        </button>
      </div>
    </div>
  );
}
